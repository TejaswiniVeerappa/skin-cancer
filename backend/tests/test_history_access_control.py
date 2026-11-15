import asyncio
import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, mock_open, patch

import numpy as np
from fastapi import HTTPException
from PIL import Image


BACKEND_ROOT = os.path.dirname(os.path.dirname(__file__))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)


class DummyModel:
    def predict(self, image_array):
        return np.array([[0.3]])


class FakeResult:
    def __init__(self, row=None):
        self._row = row

    def fetchone(self):
        return self._row


class FakeConnection:
    def __init__(self, user_row):
        self.user_row = user_row
        self.executed = []
        self.committed = False

    def execute(self, query, params=None):
        self.executed.append((str(query), params or {}))
        if "FROM users" in str(query):
            return FakeResult(self.user_row)
        return FakeResult()

    def commit(self):
        self.committed = True


class FakeEngineContext:
    def __init__(self, user_row):
        self.connection = FakeConnection(user_row)

    def __enter__(self):
        return self.connection

    def __exit__(self, exc_type, exc, tb):
        return False


with patch("tensorflow.keras.models.load_model", return_value=DummyModel()):
    from app import main as app_main


class HistoryAccessControlTests(unittest.TestCase):
    def test_get_history_uses_authenticated_user_id(self):
        with patch.object(app_main, "build_prediction_history", return_value=[{"id": 1}]) as mock_build:
            result = app_main.get_history(current_user=SimpleNamespace(id=42))

        self.assertEqual(result, [{"id": 1}])
        mock_build.assert_called_once_with(user_id=42)

    def test_get_current_user_rejects_missing_credentials(self):
        with self.assertRaises(HTTPException) as context:
            app_main.get_current_user(None)

        self.assertEqual(context.exception.status_code, 401)
        self.assertEqual(context.exception.detail, "Not authenticated")

    def test_predict_saves_logged_in_user_id(self):
        fake_user = SimpleNamespace(
            id=77,
            email="patient@example.com",
            role="patient",
            full_name="Test Patient",
        )

        fake_upload = SimpleNamespace(
            filename="test_image.png",
            read=AsyncMock(return_value=b"fake-image-bytes"),
        )

        image = Image.new("RGB", (224, 224), color="white")

        with patch.object(app_main, "save_prediction") as mock_save_prediction, \
            patch("app.main.Image.open", return_value=image), \
            patch("app.main.os.makedirs"), \
            patch("builtins.open", mock_open()):

            response = asyncio.run(
                app_main.predict(file=fake_upload, current_user=fake_user)
            )

        self.assertEqual(response["prediction"], "Malignant")
        mock_save_prediction.assert_called_once()

        saved_kwargs = mock_save_prediction.call_args.kwargs
        self.assertEqual(saved_kwargs["user_id"], 77)
        self.assertIsNone(saved_kwargs["hospital_id"])
        self.assertEqual(saved_kwargs["patient_name"], "Test Patient")
        self.assertEqual(saved_kwargs["image_path"], "test_image.png")

    def test_predict_saves_hospital_metadata(self):
        fake_user = SimpleNamespace(
            id=88,
            email="hospital@example.com",
            role="hospital",
            full_name="City Hospital",
        )

        fake_upload = SimpleNamespace(
            filename="hospital_image.png",
            read=AsyncMock(return_value=b"fake-image-bytes"),
        )

        image = Image.new("RGB", (224, 224), color="white")

        with patch.object(app_main, "save_prediction") as mock_save_prediction, \
            patch("app.main.Image.open", return_value=image), \
            patch("app.main.os.makedirs"), \
            patch("builtins.open", mock_open()):

            response = asyncio.run(
                app_main.predict(
                    file=fake_upload,
                    patient_name="John Doe",
                    current_user=fake_user,
                )
            )

        self.assertEqual(response["prediction"], "Malignant")
        mock_save_prediction.assert_called_once()

        saved_kwargs = mock_save_prediction.call_args.kwargs
        self.assertEqual(saved_kwargs["user_id"], 88)
        self.assertEqual(saved_kwargs["hospital_id"], 88)
        self.assertEqual(saved_kwargs["patient_name"], "John Doe")
        self.assertEqual(saved_kwargs["image_path"], "hospital_image.png")

    def test_forgot_password_updates_matching_role(self):
        user_row = SimpleNamespace(role="hospital")
        fake_engine = FakeEngineContext(user_row)

        with patch.object(app_main, "engine", SimpleNamespace(connect=lambda: fake_engine)), \
            patch.object(app_main.pwd_context, "hash", return_value="hashed-password"):

            response = app_main.forgot_password(
                app_main.ForgotPassword(
                    email="hospital@example.com",
                    new_password="NewPass123",
                    role="hospital",
                )
            )

        self.assertTrue(response["success"])
        self.assertTrue(fake_engine.connection.committed)
        self.assertTrue(any("UPDATE users" in stmt for stmt, _ in fake_engine.connection.executed))

    def test_forgot_password_rejects_wrong_role(self):
        user_row = SimpleNamespace(role="patient")
        fake_engine = FakeEngineContext(user_row)

        with patch.object(app_main, "engine", SimpleNamespace(connect=lambda: fake_engine)), \
            patch.object(app_main.pwd_context, "hash", return_value="hashed-password"):

            response = app_main.forgot_password(
                app_main.ForgotPassword(
                    email="patient@example.com",
                    new_password="NewPass123",
                    role="hospital",
                )
            )

        self.assertFalse(response["success"])
        self.assertIn("not hospital", response["message"])


if __name__ == "__main__":
    unittest.main()