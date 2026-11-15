import os
import numpy as np
import tensorflow as tf
from datetime import datetime, timedelta
from typing import Optional

from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.database.db import engine
from app.utils.save_prediction import save_prediction
from app.utils.save_appointment import save_appointment
from app.utils.prediction_logic import classify_prediction

# Ensure .env from backend/ is picked up (for SUPERADMIN_KEY, DATABASE_URL)
from dotenv import load_dotenv as _load_dotenv
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_ENV_FILE = os.path.normpath(os.path.join(_BASE_DIR, "..", ".env"))
_load_dotenv(_ENV_FILE)
_load_dotenv()


def ensure_core_schema():
    with engine.connect() as connection:
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS hospitals (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                address TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))

        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital_id INTEGER"))
        connection.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id INTEGER"))
        connection.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hospital_id INTEGER"))
        connection.execute(text("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS hospital_id INTEGER"))
        connection.execute(text("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255)"))
        connection.commit()


ensure_core_schema()

# -----------------------------
# Load Trained Model
# -----------------------------
model = tf.keras.models.load_model("trained_model/model.h5")

# Password Hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-skincare-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))
auth_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: int, email: str, role: str, full_name: str):
    expire_at = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "email": email,
        "role": role,
        "full_name": full_name,
        "exp": int(expire_at.timestamp()),
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_user_hospital_id(user_row):
    if not user_row:
        return None

    hospital_id = getattr(user_row, "hospital_id", None)
    if hospital_id is not None:
        return hospital_id

    if (getattr(user_row, "role", None) or "").lower() == "hospital":
        return user_row.id

    return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    with engine.connect() as connection:
        user = connection.execute(
            text("""
                SELECT
                    id,
                    full_name,
                    email,
                    role,
                    hospital_id
                FROM users
                WHERE id = :user_id
            """),
            {"user_id": int(user_id)}
        ).fetchone()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def get_optional_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    if credentials is None:
        return None

    return get_current_user(credentials)


def require_superadmin(current_user):
    if (getattr(current_user, "role", None) or "").lower() != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )


def build_prediction_history(user_id: Optional[int] = None):
    if user_id is None:
        query = text("""
            SELECT
                id,
                user_id,
                hospital_id,
                patient_name,
                image_path,
                prediction,
                confidence,
                risk_level,
                predicted_at
            FROM predictions
            ORDER BY predicted_at DESC
        """)
        params = {}
    else:
        query = text("""
            SELECT
                id,
                user_id,
                hospital_id,
                patient_name,
                image_path,
                prediction,
                confidence,
                risk_level,
                predicted_at
            FROM predictions
            WHERE user_id = :user_id
            ORDER BY predicted_at DESC
        """)
        params = {"user_id": user_id}

    with engine.connect() as connection:
        result = connection.execute(query, params)

        history = []

        for row in result:
            history.append({
                "id": row.id,
                "user_id": row.user_id,
                "hospital_id": row.hospital_id,
                "patient_name": row.patient_name,
                "image_path": row.image_path,
                "prediction": row.prediction,
                "confidence": float(row.confidence) if row.confidence else 0.0,
                "risk_level": row.risk_level,
                "predicted_at": str(row.predicted_at)
            })

    return history

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI(
    title="Skin Cancer Detection API",
    description="Backend API for the AI-Based Skin Cancer Detection System",
    version="1.0.0"
)

# -----------------------------
# Allow React Frontend
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Appointment Model
# -----------------------------
class Appointment(BaseModel):
    patient_name: str
    email: str
    phone: str
    age: int
    gender: str
    hospital_id: int
    doctor: str
    appointment_date: str
    appointment_time: str
    symptoms: str


# -----------------------------
# User Model
# -----------------------------
class User(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[str] = "patient"


# -----------------------------
# Login Model
# -----------------------------
class LoginUser(BaseModel):
    email: str
    password: str


# -----------------------------
# Forgot Password Model
# -----------------------------
class ForgotPassword(BaseModel):
    email: str
    new_password: str
    role: Optional[str] = None


# -----------------------------
# Hospital Model
# -----------------------------
class HospitalCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    password: Optional[str] = None


# -----------------------------
# Register API
# -----------------------------
@app.post("/register")
def register(user: User, superadmin_key: Optional[str] = None):

    with engine.connect() as connection:

        query = text("""
            SELECT *
            FROM users
            WHERE email = :email
        """)

        existing_user = connection.execute(
            query,
            {"email": user.email}
        ).fetchone()

        if existing_user:
            return {
                "success": False,
                "message": "Email already exists"
            }

        allowed_roles = ["superadmin", "hospital", "patient"]
        role = (user.role or "patient").lower()

        if role not in allowed_roles:
            return {"success": False, "message": f"Invalid role. Allowed: {allowed_roles}"}

        SUPERADMIN_KEY = os.getenv("SUPERADMIN_KEY")
        if role == "superadmin":
            if SUPERADMIN_KEY:
                if superadmin_key != SUPERADMIN_KEY:
                    return {"success": False, "message": "Invalid superadmin key"}
            else:
                sa_check = connection.execute(
                    text("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1")
                ).fetchone()

                if sa_check:
                    return {"success": False, "message": "A superadmin already exists. Set SUPERADMIN_KEY to override."}

        hashed_password = pwd_context.hash(user.password)

        insert_query = text("""
            INSERT INTO users(full_name, email, password, role)
            VALUES(:full_name, :email, :password, :role)
            RETURNING id
        """)

        try:
            result = connection.execute(
                insert_query,
                {
                    "full_name": user.full_name,
                    "email": user.email,
                    "password": hashed_password,
                    "role": role
                }
            )
            new_user_id = result.scalar()
            if role == "hospital":
                if new_user_id:
                    connection.execute(
                        text("UPDATE users SET hospital_id = :hospital_id WHERE id = :user_id"),
                        {"hospital_id": new_user_id, "user_id": new_user_id},
                    )
        except Exception as e:
            return {"success": False, "message": f"Database error inserting user: {e}"}

        connection.commit()

    return {
        "success": True,
        "message": "Registration Successful"
    }


# -----------------------------
# Login API
# -----------------------------
@app.post("/login")
def login(user: LoginUser):

    with engine.connect() as connection:

        query = text("""
            SELECT id, full_name, email, password, role, hospital_id
            FROM users
            WHERE email = :email
        """)

        db_user = connection.execute(
            query,
            {"email": user.email}
        ).fetchone()

        if not db_user:
            return {
                "success": False,
                "message": "Invalid Email"
            }
        if not pwd_context.verify(user.password, db_user.password):
            return {
                "success": False,
                "message": "Invalid Password"
            }
        user_role = getattr(db_user, "role", "patient") or "patient"
        hospital_id = getattr(db_user, "hospital_id", None)
        if hospital_id is None and user_role == "hospital":
            hospital_id = db_user.id

        access_token = create_access_token(
            user_id=db_user.id,
            email=db_user.email,
            role=user_role,
            full_name=db_user.full_name,
        )

        return {
            "success": True,
            "message": "Login Successful",
            "role": user_role,
            "user_id": db_user.id,
            "full_name": db_user.full_name,
            "email": db_user.email,
            "hospital_id": hospital_id,
            "access_token": access_token,
            "token_type": "bearer"
        }


# -----------------------------
# Forgot Password API
# -----------------------------
@app.post("/forgot-password")
def forgot_password(data: ForgotPassword):

    with engine.connect() as connection:

        role = (data.role or "").strip().lower() or None

        query = text("""
            SELECT *
            FROM users
            WHERE email = :email
        """)

        db_user = connection.execute(
            query,
            {"email": data.email}
        ).fetchone()

        if not db_user:
            return {
                "success": False,
                "message": "Email not found"
            }

        if role and (db_user.role or "patient").lower() != role:
            return {
                "success": False,
                "message": f"Email is registered as {db_user.role or 'patient'}, not {role}."
            }

        hashed_password = pwd_context.hash(data.new_password)

        update_query = text("""
            UPDATE users
            SET password = :password
            WHERE email = :email
        """)

        update_params = {
            "password": hashed_password,
            "email": data.email
        }

        if role:
            update_query = text("""
                UPDATE users
                SET password = :password
                WHERE email = :email AND LOWER(role) = :role
            """)
            update_params["role"] = role

        connection.execute(
            update_query,
            update_params
        )

        connection.commit()

    return {
        "success": True,
        "message": "Password updated successfully"
    }


# -----------------------------
# Home API
# -----------------------------
@app.get("/")
def home():
    return {
        "message": "Welcome to the Skin Cancer Detection API",
        "status": "Backend is running successfully!",
        "database": "Connected Successfully",
        "roles": ["patient", "hospital", "superadmin"],
        "default_superadmin_key": os.getenv("SUPERADMIN_KEY", "not set")
    }


def ensure_prediction_schema():
    with engine.connect() as connection:
        connection.execute(text("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255)"))
        connection.execute(text("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS hospital_id INTEGER"))
        connection.commit()


ensure_prediction_schema()


# -----------------------------
# Prediction API
# -----------------------------
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    patient_name: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
):

    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, file.filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    image = Image.open(file_path).convert("RGB")
    image = image.resize((224, 224))

    image_array = np.array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)

    prediction = model.predict(image_array)

    print("Raw Prediction:", prediction)

    confidence = float(prediction[0][0])

    result, confidence_score, risk_level = classify_prediction(confidence)

    if not isinstance(patient_name, str):
        patient_name = None

    provided_name = (patient_name or "").strip()

    if (getattr(current_user, "role", "") or "").lower() == "hospital":
        if not provided_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient name is required for hospital predictions",
            )
        record_patient_name = provided_name
    else:
        # For non-hospital users, prefer an explicitly provided patient name,
        # otherwise default to the logged-in user's full name.
        record_patient_name = provided_name if provided_name else getattr(current_user, "full_name", None)

    hospital_id = get_user_hospital_id(current_user)
    if current_user.role == "patient" and hospital_id is None:
        hospital_id = getattr(current_user, "hospital_id", None)

    try:
        save_prediction(
            user_id=current_user.id,
            hospital_id=hospital_id,
            patient_name=record_patient_name,
            image_path=file.filename,
            prediction=result,
            confidence=round(confidence_score, 2),
            risk_level=risk_level
        )

    except Exception as e:
        print("Database Save Error:", e)

    return {
        "filename": file.filename,
        "prediction": result,
        "confidence": f"{confidence_score:.2f}%",
        "risk_level": risk_level
    }


# -----------------------------
# Prediction History API
# -----------------------------
@app.get("/history")
def get_history(current_user=Depends(get_current_user)):
    if (getattr(current_user, "role", None) or "").lower() != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient history is only visible to the logged-in patient",
        )

    return build_prediction_history(user_id=current_user.id)


# -----------------------------
# Book Appointment API
# -----------------------------
@app.post("/book-appointment")
def book_appointment(data: Appointment, current_user=Depends(get_optional_current_user)):

    if not data.hospital_id:
        return {
            "success": False,
            "message": "Please select a hospital"
        }

    selected_hospital_id = int(data.hospital_id)

    if current_user and (getattr(current_user, "role", "") or "").lower() == "patient":
        with engine.connect() as connection:
            connection.execute(
                text("UPDATE users SET hospital_id = :hospital_id WHERE id = :user_id"),
                {"hospital_id": selected_hospital_id, "user_id": current_user.id},
            )
            connection.commit()

    try:

        appointment_id = save_appointment(
            user_id=current_user.id if current_user else None,
            hospital_id=selected_hospital_id,
            patient_name=data.patient_name,
            email=data.email,
            phone=data.phone,
            age=data.age,
            gender=data.gender,
            doctor=data.doctor,
            appointment_date=data.appointment_date,
            appointment_time=data.appointment_time,
            symptoms=data.symptoms
        )

        return {
            "success": True,
            "appointment_id": appointment_id,
            "message": "Appointment booked successfully!"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }


# -----------------------------
# Dashboard API
# -----------------------------
@app.get("/dashboard")
def dashboard(current_user=Depends(get_current_user)):

    is_superadmin = (getattr(current_user, "role", None) or "").lower() == "superadmin"
    hospital_id = get_user_hospital_id(current_user)

    prediction_filter = ""
    appointment_filter = ""
    user_filter = ""
    params = {}

    if not is_superadmin and hospital_id is not None:
        prediction_filter = " WHERE hospital_id = :hospital_id"
        appointment_filter = " WHERE hospital_id = :hospital_id"
        user_filter = " WHERE hospital_id = :hospital_id"
        params = {"hospital_id": hospital_id}
    elif (getattr(current_user, "role", None) or "").lower() == "patient":
        prediction_filter = " WHERE user_id = :user_id"
        appointment_filter = " WHERE user_id = :user_id"
        user_filter = " WHERE id = :user_id"
        params = {"user_id": current_user.id}

    with engine.connect() as connection:

        total_predictions = connection.execute(
            text(f"SELECT COUNT(*) FROM predictions{prediction_filter}"),
            params,
        ).scalar() or 0

        benign = connection.execute(
            text(f"SELECT COUNT(*) FROM predictions{prediction_filter}{' AND' if prediction_filter else ' WHERE'} prediction='Benign'"),
            params,
        ).scalar() or 0

        malignant = connection.execute(
            text(f"SELECT COUNT(*) FROM predictions{prediction_filter}{' AND' if prediction_filter else ' WHERE'} prediction='Malignant'"),
            params,
        ).scalar() or 0

        appointments = connection.execute(
            text(f"SELECT COUNT(*) FROM appointments{appointment_filter}"),
            params,
        ).scalar() or 0

        total_users = connection.execute(
            text(f"SELECT COUNT(*) FROM users{user_filter}"),
            params,
        ).scalar() or 0

        total_patients = connection.execute(
            text(f"SELECT COUNT(*) FROM users{user_filter}{' AND' if user_filter else ' WHERE'} role='patient'"),
            params,
        ).scalar() or 0

        total_hospitals = connection.execute(
            text("SELECT COUNT(*) FROM users WHERE role='hospital'")
        ).scalar() or 0

        total_superadmins = connection.execute(
            text("SELECT COUNT(*) FROM users WHERE role='superadmin'")
        ).scalar() or 0

        pending_apts = connection.execute(
            text(f"SELECT COUNT(*) FROM appointments{appointment_filter}{' AND' if appointment_filter else ' WHERE'} (status='Pending' OR status IS NULL)"),
            params,
        ).scalar() or 0

        approved_apts = connection.execute(
            text(f"SELECT COUNT(*) FROM appointments{appointment_filter}{' AND' if appointment_filter else ' WHERE'} status='Approved'"),
            params,
        ).scalar() or 0

        completed_apts = connection.execute(
            text(f"SELECT COUNT(*) FROM appointments{appointment_filter}{' AND' if appointment_filter else ' WHERE'} status='Completed'"),
            params,
        ).scalar() or 0

        cancelled_apts = connection.execute(
            text(f"SELECT COUNT(*) FROM appointments{appointment_filter}{' AND' if appointment_filter else ' WHERE'} (status='Cancelled' OR status='Rejected')"),
            params,
        ).scalar() or 0

    return {
        "total_predictions": total_predictions,
        "benign": benign,
        "malignant": malignant,
        "appointments": appointments,
        "total_users": total_users,
        "total_patients": total_patients,
        "total_hospitals": total_hospitals,
        "total_superadmins": total_superadmins,
        "pending_apts": pending_apts,
        "approved_apts": approved_apts,
        "completed_apts": completed_apts,
        "cancelled_apts": cancelled_apts
    }


# -----------------------------
# Cancel Appointment API
# -----------------------------
@app.put("/cancel-appointment/{appointment_id}")
def cancel_appointment(appointment_id: int, current_user=Depends(get_current_user)):

    with engine.connect() as connection:

        appointment = connection.execute(
            text("SELECT hospital_id, user_id FROM appointments WHERE id = :id"),
            {"id": appointment_id},
        ).fetchone()

        if not appointment:
            return {"success": False, "message": "Appointment not found"}

        role = (getattr(current_user, "role", None) or "").lower()
        hospital_id = get_user_hospital_id(current_user)

        if role != "superadmin":
            if role == "hospital" and appointment.hospital_id != hospital_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
            if role == "patient" and appointment.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

        query = text("""
            UPDATE appointments
            SET status = 'Cancelled'
            WHERE id = :id
        """)

        connection.execute(query, {"id": appointment_id})
        connection.commit()

    return {
        "success": True,
        "message": "Appointment cancelled successfully!"
    }


# -----------------------------
# Complete Appointment API
# -----------------------------
@app.put("/complete-appointment/{appointment_id}")
def complete_appointment(appointment_id: int, current_user=Depends(get_current_user)):

    with engine.connect() as connection:

        appointment = connection.execute(
            text("SELECT hospital_id, user_id FROM appointments WHERE id = :id"),
            {"id": appointment_id},
        ).fetchone()

        if not appointment:
            return {"success": False, "message": "Appointment not found"}

        role = (getattr(current_user, "role", None) or "").lower()
        hospital_id = get_user_hospital_id(current_user)

        if role != "superadmin":
            if role == "hospital" and appointment.hospital_id != hospital_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
            if role == "patient" and appointment.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

        query = text("""
            UPDATE appointments
            SET status = 'Completed'
            WHERE id = :id
        """)

        connection.execute(query, {"id": appointment_id})
        connection.commit()

    return {
        "success": True,
        "message": "Appointment marked as completed!"
    }


# -----------------------------
# Approve Appointment API
# -----------------------------
@app.put("/approve-appointment/{appointment_id}")
def approve_appointment(appointment_id: int, current_user=Depends(get_current_user)):

    with engine.connect() as connection:

        appointment = connection.execute(
            text("SELECT hospital_id, user_id FROM appointments WHERE id = :id"),
            {"id": appointment_id},
        ).fetchone()

        if not appointment:
            return {"success": False, "message": "Appointment not found"}

        role = (getattr(current_user, "role", None) or "").lower()
        hospital_id = get_user_hospital_id(current_user)

        if role != "superadmin":
            if role == "hospital" and appointment.hospital_id != hospital_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
            if role == "patient" and appointment.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

        query = text("""
            UPDATE appointments
            SET status = 'Approved'
            WHERE id = :id
        """)

        connection.execute(query, {"id": appointment_id})
        connection.commit()

    return {
        "success": True,
        "message": "Appointment approved successfully!"
    }


# -----------------------------
# Reject Appointment API
# -----------------------------
@app.put("/reject-appointment/{appointment_id}")
def reject_appointment(appointment_id: int, current_user=Depends(get_current_user)):

    with engine.connect() as connection:

        appointment = connection.execute(
            text("SELECT hospital_id, user_id FROM appointments WHERE id = :id"),
            {"id": appointment_id},
        ).fetchone()

        if not appointment:
            return {"success": False, "message": "Appointment not found"}

        role = (getattr(current_user, "role", None) or "").lower()
        hospital_id = get_user_hospital_id(current_user)

        if role != "superadmin":
            if role == "hospital" and appointment.hospital_id != hospital_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
            if role == "patient" and appointment.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

        query = text("""
            UPDATE appointments
            SET status = 'Rejected'
            WHERE id = :id
        """)

        connection.execute(query, {"id": appointment_id})
        connection.commit()

    return {
        "success": True,
        "message": "Appointment rejected successfully!"
    }


# -----------------------------
# List All Users API
# -----------------------------
@app.get("/users")
def list_users(current_user=Depends(get_current_user)):

    require_superadmin(current_user)

    query = text("""
        SELECT
            id,
            full_name,
            email,
            role
        FROM users
        ORDER BY id ASC
    """)

    with engine.connect() as connection:

        result = connection.execute(query)

        users = []

        for row in result:

            users.append({
                "id": row.id,
                "full_name": row.full_name,
                "email": row.email,
                "role": row.role or "patient"
            })

    return users


# -----------------------------
# List Patients Only API
# -----------------------------
@app.get("/patients")
def list_patients(current_user=Depends(get_current_user)):

    role = (getattr(current_user, "role", None) or "").lower()
    hospital_id = get_user_hospital_id(current_user)

    if role == "superadmin":
        query = text("""
            SELECT id, full_name, email, role
            FROM users
            WHERE role = 'patient' OR role IS NULL
            ORDER BY id ASC
        """)
        params = {}
    elif role == "hospital" and hospital_id is not None:
        query = text("""
            SELECT DISTINCT
                COALESCE(u.id, 0) AS id,
                a.patient_name AS full_name,
                a.email,
                'patient' AS role
            FROM appointments a
            LEFT JOIN users u ON u.id = a.user_id
            WHERE a.hospital_id = :hospital_id
            ORDER BY a.patient_name ASC
        """)
        params = {"hospital_id": hospital_id}
    else:
        query = text("""
            SELECT id, full_name, email, role
            FROM users
            WHERE id = :user_id
        """)
        params = {"user_id": current_user.id}

    with engine.connect() as connection:
        result = connection.execute(query, params)
        patients = []
        for row in result:
            patients.append({
                "id": row.id,
                "full_name": row.full_name,
                "email": row.email,
                "role": "patient"
            })
    return patients


# -----------------------------
# List All Appointments API
# -----------------------------
@app.get("/appointments")
def list_appointments(current_user=Depends(get_current_user)):

    role = (getattr(current_user, "role", None) or "").lower()
    hospital_id = get_user_hospital_id(current_user)

    if role == "superadmin":
        query = text("""
            SELECT
                id,
                user_id,
                hospital_id,
                patient_name,
                email,
                phone,
                age,
                gender,
                doctor,
                appointment_date,
                appointment_time,
                symptoms,
                status
            FROM appointments
            ORDER BY appointment_date DESC, appointment_time DESC
        """)
        params = {}
    elif role == "hospital" and hospital_id is not None:
        query = text("""
            SELECT
                id,
                user_id,
                hospital_id,
                patient_name,
                email,
                phone,
                age,
                gender,
                doctor,
                appointment_date,
                appointment_time,
                symptoms,
                status
            FROM appointments
            WHERE hospital_id = :hospital_id
            ORDER BY appointment_date DESC, appointment_time DESC
        """)
        params = {"hospital_id": hospital_id}
    else:
        query = text("""
            SELECT
                id,
                user_id,
                hospital_id,
                patient_name,
                email,
                phone,
                age,
                gender,
                doctor,
                appointment_date,
                appointment_time,
                symptoms,
                status
            FROM appointments
            WHERE user_id = :user_id
            ORDER BY appointment_date DESC, appointment_time DESC
        """)
        params = {"user_id": current_user.id}

    with engine.connect() as connection:

        result = connection.execute(query, params)

        appointments = []

        for row in result:

            appointments.append({
                "id": row.id,
                "user_id": row.user_id,
                "hospital_id": row.hospital_id,
                "patient_name": row.patient_name,
                "email": row.email,
                "phone": row.phone,
                "age": row.age,
                "gender": row.gender,
                "doctor": row.doctor,
                "appointment_date": str(row.appointment_date) if row.appointment_date else "",
                "appointment_time": str(row.appointment_time) if row.appointment_time else "",
                "symptoms": row.symptoms,
                "status": row.status or "Pending"
            })

    return appointments


# -----------------------------
# Hospitals (Users with role=hospital) List
# -----------------------------
@app.get("/hospitals")
def list_hospitals():

    query = text("""
        SELECT id, full_name AS name, email, role
        FROM users
        WHERE role = 'hospital'
        ORDER BY id ASC
    """)

    with engine.connect() as connection:
        result = connection.execute(query)
        hospitals = []
        for row in result:
            hospitals.append({
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "role": "hospital"
            })
    return hospitals


# -----------------------------
# Add Hospital API (creates user with role=hospital)
# -----------------------------
@app.post("/hospitals")
def add_hospital(data: HospitalCreate, current_user=Depends(get_current_user)):

    require_superadmin(current_user)

    with engine.connect() as connection:

        existing = connection.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": data.email}
        ).fetchone()

        if existing:
            return {"success": False, "message": "Email already exists"}

        pwd = data.password or "hospital123"
        hashed_pwd = pwd_context.hash(pwd)

        result = connection.execute(
            text("""
                INSERT INTO users(full_name, email, password, role)
                VALUES(:full_name, :email, :password, 'hospital')
                RETURNING id
            """),
            {
                "full_name": data.name,
                "email": data.email,
                "password": hashed_pwd
            }
        )
        new_id = None
        try:
            new_id = result.scalar()
        except Exception:
            pass

        if new_id:
            connection.execute(
                text("UPDATE users SET hospital_id = :hospital_id WHERE id = :user_id"),
                {"hospital_id": new_id, "user_id": new_id},
            )

        connection.commit()

    return {
        "success": True,
        "message": "Hospital added successfully! Default password: hospital123",
        "hospital_id": new_id
    }


# -----------------------------
# Update Hospital API
# -----------------------------
@app.put("/hospitals/{hospital_id}")
def update_hospital(hospital_id: int, data: HospitalCreate, current_user=Depends(get_current_user)):

    require_superadmin(current_user)

    with engine.connect() as connection:
        existing = connection.execute(
            text("SELECT id FROM users WHERE id = :id AND role = 'hospital'"),
            {"id": hospital_id}
        ).fetchone()

        if not existing:
            return {"success": False, "message": "Hospital not found"}

        updates = ["full_name = :full_name", "email = :email"]
        params = {
            "id": hospital_id,
            "full_name": data.name,
            "email": data.email,
        }

        if data.password:
            updates.append("password = :password")
            params["password"] = pwd_context.hash(data.password)

        connection.execute(
            text(f"UPDATE users SET {', '.join(updates)} WHERE id = :id"),
            params,
        )
        connection.commit()

    return {"success": True, "message": "Hospital updated successfully!"}


# -----------------------------
# Delete Hospital API
# -----------------------------
@app.delete("/hospitals/{hospital_id}")
def delete_hospital(hospital_id: int, current_user=Depends(get_current_user)):

    require_superadmin(current_user)

    with engine.connect() as connection:

        check = connection.execute(
            text("SELECT id, role FROM users WHERE id = :id"),
            {"id": hospital_id}
        ).fetchone()

        if not check:
            return {"success": False, "message": "Hospital not found"}

        if (getattr(check, "role", None) or "") != "hospital":
            return {"success": False, "message": "User is not a hospital"}

        connection.execute(
            text("DELETE FROM users WHERE id = :id"),
            {"id": hospital_id}
        )
        connection.commit()

    return {
        "success": True,
        "message": "Hospital deleted successfully!"
    }


# -----------------------------
# Delete User API (Super Admin)
# -----------------------------
@app.delete("/users/{user_id}")
def delete_user(user_id: int, current_user=Depends(get_current_user)):

    require_superadmin(current_user)

    with engine.connect() as connection:
        check = connection.execute(
            text("SELECT id FROM users WHERE id = :id"),
            {"id": user_id}
        ).fetchone()
        if not check:
            return {"success": False, "message": "User not found"}
        connection.execute(
            text("DELETE FROM users WHERE id = :id"),
            {"id": user_id}
        )
        connection.commit()

    return {"success": True, "message": "User deleted successfully!"}


# -----------------------------
# All Predictions (Super Admin)
# -----------------------------
@app.get("/predictions")
def list_predictions(current_user=Depends(get_current_user)):
    role = (getattr(current_user, "role", None) or "").lower()
    hospital_id = get_user_hospital_id(current_user)

    if role == "superadmin":
        return build_prediction_history()

    if role == "hospital" and hospital_id is not None:
        query = text("""
            SELECT
                id,
                user_id,
                hospital_id,
                patient_name,
                image_path,
                prediction,
                confidence,
                risk_level,
                predicted_at
            FROM predictions
            WHERE hospital_id = :hospital_id
            ORDER BY predicted_at DESC
        """)
        params = {"hospital_id": hospital_id}
    else:
        query = text("""
            SELECT
                id,
                user_id,
                hospital_id,
                patient_name,
                image_path,
                prediction,
                confidence,
                risk_level,
                predicted_at
            FROM predictions
            WHERE user_id = :user_id
            ORDER BY predicted_at DESC
        """)
        params = {"user_id": current_user.id}

    with engine.connect() as connection:
        result = connection.execute(query, params)
        history = []

        for row in result:
            history.append({
                "id": row.id,
                "user_id": row.user_id,
                "hospital_id": row.hospital_id,
                "patient_name": row.patient_name,
                "image_path": row.image_path,
                "prediction": row.prediction,
                "confidence": float(row.confidence) if row.confidence else 0.0,
                "risk_level": row.risk_level,
                "predicted_at": str(row.predicted_at)
            })

    return history
