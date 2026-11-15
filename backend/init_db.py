import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())

from sqlalchemy import text
from app.database.db import engine

def init_db():
    with engine.connect() as conn:
        existing = conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
        )).fetchall()
        existing_tables = {r[0] for r in existing}
        print(f"Existing tables: {existing_tables}")

        if "users" not in existing_tables:
            conn.execute(text("""
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'patient'
                )
            """))
            print("Created 'users' table")
        else:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital_id INTEGER"))
                conn.execute(text("SELECT role FROM users LIMIT 1"))
                print("'role' column exists in users")
            except Exception:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'patient'"))
                print("Added 'role' column to users table")

        if "predictions" not in existing_tables:
            conn.execute(text("""
                CREATE TABLE predictions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    hospital_id INTEGER,
                    patient_name VARCHAR(255),
                    image_path VARCHAR(500),
                    prediction VARCHAR(100),
                    confidence FLOAT,
                    risk_level VARCHAR(50),
                    predicted_at TIMESTAMP DEFAULT NOW()
                )
            """))
            print("Created 'predictions' table")
        else:
            try:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS hospital_id INTEGER"))
                conn.execute(text("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255)"))
                print("Ensured prediction history columns exist")
            except Exception as e:
                print(f"Could not ensure prediction columns: {e}")

        if "appointments" not in existing_tables:
            conn.execute(text("""
                CREATE TABLE appointments (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    hospital_id INTEGER,
                    patient_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    age INTEGER,
                    gender VARCHAR(20),
                    doctor VARCHAR(255),
                    appointment_date DATE,
                    appointment_time TIME,
                    symptoms TEXT,
                    status VARCHAR(50) DEFAULT 'Pending'
                )
            """))
            print("Created 'appointments' table")
        else:
            try:
                conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id INTEGER"))
                conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hospital_id INTEGER"))
                print("Ensured appointment ownership columns exist")
            except Exception as e:
                print(f"Could not ensure appointment columns: {e}")

        conn.commit()
        print("DB initialization done.")

if __name__ == "__main__":
    init_db()
