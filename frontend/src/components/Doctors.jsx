import { FaUserMd, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Doctors() {
  const navigate = useNavigate();

  const doctors = [
    {
      id: 1,
      name: "Dr. John Smith",
      specialization: "Dermatologist",
      experience: "12 Years",
      hospital: "City Skin Hospital",
    },
    {
      id: 2,
      name: "Dr. Priya Sharma",
      specialization: "Skin Cancer Specialist",
      experience: "10 Years",
      hospital: "Apollo Hospital",
    },
    {
      id: 3,
      name: "Dr. Rahul Verma",
      specialization: "Dermato-Oncologist",
      experience: "8 Years",
      hospital: "AIIMS",
    },
  ];

  return (
    <section className="doctor-section">
      <h2 className="doctor-title">Meet Our Specialists</h2>

      <p className="doctor-subtitle">
        Consult experienced dermatologists after your AI skin cancer prediction.
      </p>

      <div className="doctor-container">
        {doctors.map((doctor) => (
          <div
            className="doctor-card"
            key={doctor.id}
            onClick={() => navigate(`/doctor/${doctor.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className="doctor-avatar">
              <FaUserMd />
            </div>

            <h3>{doctor.name}</h3>

            <h4>{doctor.specialization}</h4>

            <p className="experience">
              Experience: {doctor.experience}
            </p>

            <p className="hospital">
              {doctor.hospital}
            </p>

            <div className="rating">
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/appointment");
              }}
            >
              Book Appointment
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Doctors;