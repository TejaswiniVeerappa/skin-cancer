import { useParams, useNavigate } from "react-router-dom";
import { FaUserMd, FaAward, FaHospital, FaGraduationCap } from "react-icons/fa";
import "../styles/DoctorDetails.css";

function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const doctors = {
    1: {
      name: "Dr. John Smith",
      specialization: "Dermatologist",
      qualification: "MBBS, MD Dermatology",
      education: "Harvard Medical School, USA",
      hospital: "City Skin Hospital",
      experience: "12 Years",
      patients: "4500+ Patients Treated",
      awards: "National Dermatology Excellence Award",
      languages: "English, Hindi",
      about:
        "Dr. John Smith is an experienced dermatologist specializing in skin cancer detection, acne treatment, psoriasis, eczema, and laser skin procedures.",
    },

    2: {
      name: "Dr. Priya Sharma",
      specialization: "Skin Cancer Specialist",
      qualification: "MBBS, MD Dermatology",
      education: "AIIMS Delhi",
      hospital: "Apollo Hospital",
      experience: "10 Years",
      patients: "3800+ Patients Treated",
      awards: "Best Skin Cancer Specialist 2023",
      languages: "English, Hindi, Kannada",
      about:
        "Dr. Priya Sharma specializes in melanoma diagnosis, mole examination, dermoscopy, and advanced skin cancer treatment.",
    },

    3: {
      name: "Dr. Rahul Verma",
      specialization: "Dermato-Oncologist",
      qualification: "MBBS, MD, Fellowship in Dermato-Oncology",
      education: "CMC Vellore",
      hospital: "AIIMS",
      experience: "8 Years",
      patients: "3000+ Patients Treated",
      awards: "Young Dermatologist Award",
      languages: "English, Hindi",
      about:
        "Dr. Rahul Verma has expertise in dermato-oncology, skin biopsy, melanoma treatment, and advanced dermatological procedures.",
    },
  };

  const doctor = doctors[id];

  if (!doctor) {
    return <h2>Doctor Not Found</h2>;
  }

  return (
    <div className="doctor-details-container">

      <div className="doctor-profile-card">

        <div className="doctor-image">
          <FaUserMd />
        </div>

        <h1>{doctor.name}</h1>

        <h3>{doctor.specialization}</h3>

        <div className="doctor-info">

          <p><FaGraduationCap /> <strong>Qualification:</strong> {doctor.qualification}</p>

          <p><FaGraduationCap /> <strong>Education:</strong> {doctor.education}</p>

          <p><FaHospital /> <strong>Hospital:</strong> {doctor.hospital}</p>

          <p><strong>Experience:</strong> {doctor.experience}</p>

          <p><strong>Patients Treated:</strong> {doctor.patients}</p>

          <p><FaAward /> <strong>Awards:</strong> {doctor.awards}</p>

          <p><strong>Languages:</strong> {doctor.languages}</p>

        </div>

        <div className="about-section">
          <h2>About Doctor</h2>

          <p>{doctor.about}</p>
        </div>

        <button
          className="appointment-btn"
          onClick={() => navigate("/appointment")}
        >
          Book Appointment
        </button>

      </div>

    </div>
  );
}

export default DoctorDetails;