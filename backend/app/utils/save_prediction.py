from sqlalchemy import text
from app.database.db import engine


def save_prediction(user_id, hospital_id, patient_name, image_path, prediction, confidence, risk_level):

    query = text("""
        INSERT INTO predictions
        (user_id, hospital_id, patient_name, image_path, prediction, confidence, risk_level, predicted_at)
        VALUES
        (:user_id, :hospital_id, :patient_name, :image_path, :prediction, :confidence, :risk_level, NOW())
    """)

    with engine.connect() as connection:
        connection.execute(
            query,
            {
                "user_id": user_id,
                "hospital_id": hospital_id,
                "patient_name": patient_name,
                "image_path": image_path,
                "prediction": prediction,
                "confidence": confidence,
                "risk_level": risk_level
            }
        )
        connection.commit()

    print("✅ Prediction saved successfully!")