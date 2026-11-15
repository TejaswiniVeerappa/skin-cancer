import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Appointment.css";

function Appointment() {

  const [form, setForm] = useState({
    patient_name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    hospital_id: "",
    doctor: "",
    appointment_date: "",
    appointment_time: "",
    symptoms: "",
  });

  const [hospitals, setHospitals] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Appointment Details
  const [appointmentId, setAppointmentId] = useState(null);
  const [appointmentStatus, setAppointmentStatus] = useState("");

  useEffect(() => {
    api
      .get("/hospitals")
      .then((response) => setHospitals(response.data || []))
      .catch((error) => {
        console.error("Error loading hospitals:", error);
        setHospitals([]);
      });
  }, []);

  const doctors = [
    {
      id: 1,
      name: "Dr. John Smith",
      specialization: "Dermatologist",
      qualification: "MBBS, MD Dermatology",
      education: "Harvard Medical School",
      experience: "12 Years",
      hospital: "City Skin Hospital",
      awards: "National Dermatology Excellence Award",
      languages: "English, Hindi",
      about:
        "Expert in skin cancer diagnosis, acne treatment, psoriasis, eczema and laser skin procedures.",
    },
    {
      id: 2,
      name: "Dr. Priya Sharma",
      specialization: "Skin Cancer Specialist",
      qualification: "MBBS, MD Dermatology",
      education: "AIIMS Delhi",
      experience: "10 Years",
      hospital: "Apollo Hospital",
      awards: "Best Skin Cancer Specialist 2023",
      languages: "English, Hindi, Kannada",
      about:
        "Specialist in melanoma detection, dermoscopy and advanced skin cancer treatment.",
    },
    {
      id: 3,
      name: "Dr. Rahul Verma",
      specialization: "Dermato-Oncologist",
      qualification:
        "MBBS, MD, Fellowship in Dermato-Oncology",
      education: "CMC Vellore",
      experience: "8 Years",
      hospital: "AIIMS",
      awards: "Young Dermatologist Award",
      languages: "English, Hindi",
      about:
        "Experienced in dermato-oncology, skin biopsy, melanoma treatment and advanced dermatological procedures.",
    },
  ];

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Book Appointment
  const bookAppointment = async (e) => {

    e.preventDefault();

    try {

      const res = await api.post("/book-appointment", form);
      const data = res.data;

      console.log("Status:", res.status);
      console.log("Response:", data);

      if (data.success) {

        setSuccessMessage(
          `Appointment booked successfully with ${form.doctor}`
        );

        setAppointmentId(data.appointment_id);

        setAppointmentStatus("Pending");

        setTimeout(() => {
          setSuccessMessage("");
        }, 4000);

      } else {

        alert(data.message);

      }

    } catch (error) {

      console.error(error);
      const msg = (error && error.response && error.response.data && error.response.data.message) || error.message || "Something went wrong.";
      alert(msg);

    }
  };

  // Cancel Appointment
  const cancelAppointment = async () => {

    if (!appointmentId) {
      alert("No active appointment found.");
      return;
    }

    const res = await api.put(`/cancel-appointment/${appointmentId}`);
    const data = res.data;

    if (data.success) {

      setAppointmentStatus("Cancelled");

      alert("Appointment Cancelled Successfully");

    }

  };

  // Complete Appointment
  const completeAppointment = async () => {

    if (!appointmentId) {
      alert("No active appointment found.");
      return;
    }

    const res = await api.put(`/complete-appointment/${appointmentId}`);
    const data = res.data;

    if (data.success) {

      setAppointmentStatus("Completed");

      alert("Appointment Completed Successfully");

    }

  };

  return (

    <div className="appointment-page">

      <h1 className="appointment-title">

        Book Appointment

      </h1>

      <p className="appointment-subtitle">

        Consult our experienced dermatologists for professional skin cancer diagnosis.

      </p>
            {/* Success Popup */}

      {successMessage && (

        <div className="popup-overlay">

          <div className="popup-box">

            <div className="popup-icon">✅</div>

            <h2>Appointment Booked!</h2>

            <p>{successMessage}</p>

            <button
              className="popup-btn"
              onClick={() => setSuccessMessage("")}
            >
              OK
            </button>

          </div>

        </div>

      )}

      {/* Appointment Status */}

      {(appointmentId || appointmentStatus) && (

        <div className="appointment-status-card">

          <h2>Appointment Details</h2>

          <p>
            <strong>Appointment ID :</strong> {appointmentId}
          </p>

          <p>
            <strong>Hospital :</strong> {hospitals.find((item) => String(item.id) === String(form.hospital_id))?.name || "—"}
          </p>

          <p>
            <strong>Doctor :</strong> {form.doctor}
          </p>

          <p>
            <strong>Date :</strong> {form.appointment_date}
          </p>

          <p>
            <strong>Time :</strong> {form.appointment_time}
          </p>

          <p>
            <strong>Status :</strong> {appointmentStatus}
          </p>

          {appointmentStatus === "Pending" && (

            <div className="status-buttons">

              <button
                className="cancel-btn"
                onClick={cancelAppointment}
              >
                Cancel Appointment
              </button>

              <button
                className="complete-btn"
                onClick={completeAppointment}
              >
                Mark as Completed
              </button>

            </div>

          )}

        </div>

      )}

      {/* Doctor Cards */}

      <div className="doctor-container">

        {doctors.map((doctor) => (

          <div
            className="doctor-card"
            key={doctor.id}
          >

            <div className="doctor-avatar">

              👨‍⚕️

            </div>

            <h3>{doctor.name}</h3>

            <p>{doctor.specialization}</p>

            <p>{doctor.experience}</p>

            <p>{doctor.hospital}</p>

            <button
              type="button"
              className="appointment-btn"
              onClick={() => {

                setSelectedDoctor(doctor);

                setForm({
                  ...form,
                  doctor: doctor.name,
                });

              }}
            >
              View Profile
            </button>

          </div>

        ))}

      </div>

      {/* Doctor Profile */}

      {selectedDoctor && (

        <div className="doctor-profile">

          <div className="doctor-profile-image">

            👨‍⚕️

          </div>

          <h2>{selectedDoctor.name}</h2>

          <h3>{selectedDoctor.specialization}</h3>

          <div className="doctor-details">

            <p>

              <strong>Qualification :</strong>

              {selectedDoctor.qualification}

            </p>

            <p>

              <strong>Education :</strong>

              {selectedDoctor.education}

            </p>

            <p>

              <strong>Hospital :</strong>

              {selectedDoctor.hospital}

            </p>

            <p>

              <strong>Experience :</strong>

              {selectedDoctor.experience}

            </p>

            <p>

              <strong>Awards :</strong>

              {selectedDoctor.awards}

            </p>

            <p>

              <strong>Languages :</strong>

              {selectedDoctor.languages}

            </p>

          </div>

          <div className="doctor-about">

            <h3>About Doctor</h3>

            <p>{selectedDoctor.about}</p>

          </div>

        </div>

      )}

      {/* Appointment Form */}

      <form
        className="appointment-form"
        onSubmit={bookAppointment}
      >

        <div className="form-grid">

          <input
            type="text"
            name="patient_name"
            placeholder="Patient Name"
            value={form.patient_name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <select
            name="hospital_id"
            value={form.hospital_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Hospital</option>
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            required
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <select
            name="doctor"
            value={form.doctor}
            onChange={handleChange}
            required
          >
            <option value="">Select Doctor</option>

            {doctors.map((doctor) => (
              <option
                key={doctor.id}
                value={doctor.name}
              >
                {doctor.name}
              </option>
            ))}

          </select>

          <input
            type="date"
            name="appointment_date"
            value={form.appointment_date}
            onChange={handleChange}
            required
          />

          <input
            type="time"
            name="appointment_time"
            value={form.appointment_time}
            onChange={handleChange}
            required
          />

        </div>

        <textarea
          name="symptoms"
          rows="5"
          placeholder="Describe your symptoms..."
          value={form.symptoms}
          onChange={handleChange}
        />

        <button
          type="submit"
          className="appointment-btn"
        >
          📅 Confirm Appointment
        </button>

      </form>

    </div>

  );

}

export default Appointment;