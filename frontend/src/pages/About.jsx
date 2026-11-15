import {
  FaHeartbeat,
  FaBullseye,
  FaLaptopCode,
  FaShieldAlt,
  FaDatabase,
  FaRobot,
} from "react-icons/fa";

import "../styles/About.css";

function About() {
  return (
    <div className="about-page">

      <div className="about-header">
        <h1>About SkinCare AI</h1>
        <p>
          AI-Powered Skin Cancer Detection System for Early Diagnosis and Better Healthcare.
        </p>
      </div>

      {/* What is Skin Cancer */}

      <div className="about-card">

        <FaHeartbeat className="about-icon" />

        <h2>What is Skin Cancer?</h2>

        <p>
          Skin cancer is one of the most common cancers worldwide.
          Early detection significantly improves treatment success.
          Our AI system analyzes skin lesion images and assists doctors
          by providing quick and accurate predictions.
        </p>

      </div>

      {/* Objective */}

      <div className="about-card">

        <FaBullseye className="about-icon" />

        <h2>Project Objective</h2>

        <p>
          The objective of this project is to use Artificial Intelligence
          and Deep Learning to detect skin cancer at an early stage.
          The system helps patients upload skin images, receive AI predictions,
          understand risk levels, and book dermatologist appointments.
        </p>

      </div>

      {/* Technologies */}

      <div className="technology-section">

        <h2>Technologies Used</h2>

        <div className="tech-grid">

          <div className="tech-card">
            <FaRobot />
            <h3>TensorFlow</h3>
            <p>Deep Learning Model</p>
          </div>

          <div className="tech-card">
            <FaLaptopCode />
            <h3>React JS</h3>
            <p>Frontend Development</p>
          </div>

          <div className="tech-card">
            <FaDatabase />
            <h3>PostgreSQL</h3>
            <p>Database Management</p>
          </div>

          <div className="tech-card">
            <FaShieldAlt />
            <h3>FastAPI</h3>
            <p>Backend API</p>
          </div>

        </div>

      </div>

      {/* Features */}

      <div className="about-card">

        <h2>Key Features</h2>

        <ul>
          <li>✅ AI Skin Cancer Detection</li>
          <li>✅ Image Upload & Analysis</li>
          <li>✅ Risk Level Prediction</li>
          <li>✅ AI Diagnosis Report</li>
          <li>✅ PDF Report Download</li>
          <li>✅ Prediction History</li>
          <li>✅ Interactive Dashboard</li>
          <li>✅ Doctor Appointment Booking</li>
          <li>✅ PostgreSQL Database Integration</li>
        </ul>

      </div>

      {/* Future Scope */}

      <div className="about-card">

        <h2>Future Scope</h2>

        <p>
          Future improvements include live dermatologist consultation,
          cloud deployment, multi-language support, mobile applications,
          and integration with hospital management systems for real-time diagnosis.
        </p>

      </div>

      {/* Developer */}

      <div className="developer-card">

        <h2>Developer</h2>

        <h3>Tejashwini Kurtakoti</h3>

        <p>Computer Science & Engineering</p>

        <p>SDM College of Engineering & Technology</p>

        <p>AI Based Skin Cancer Detection System</p>

      </div>

    </div>
  );
}

export default About;