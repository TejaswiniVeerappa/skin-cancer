from sqlalchemy import text
from app.database.db import engine

def save_appointment(
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
    symptoms
):

    query = text("""
        INSERT INTO appointments
        (
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
        )

        VALUES
        (
            :user_id,
            :hospital_id,
            :patient_name,
            :email,
            :phone,
            :age,
            :gender,
            :doctor,
            :appointment_date,
            :appointment_time,
            :symptoms,
            'Pending'
        )

        RETURNING id;
    """)

    with engine.connect() as connection:

        result = connection.execute(
            query,
            {
                "user_id": user_id,
                "hospital_id": hospital_id,
                "patient_name": patient_name,
                "email": email,
                "phone": phone,
                "age": age,
                "gender": gender,
                "doctor": doctor,
                "appointment_date": appointment_date,
                "appointment_time": appointment_time,
                "symptoms": symptoms
            }
        )

        appointment_id = result.scalar()

        connection.commit()

    print("Appointment Saved Successfully")

    return appointment_id