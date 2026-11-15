import { FaUpload, FaRobot, FaFileMedical, FaUserMd } from "react-icons/fa";
import "../styles/Home.css";

function HowItWorks() {
  return (
    <section className="how-section">

      <h2 className="how-title">
        How It Works
      </h2>

      <div className="how-container">

        <div className="how-card">
          <FaUpload className="how-icon" />
          <h3>Upload Image</h3>
          <p>Upload your skin lesion image securely.</p>
        </div>

        <div className="arrow">➜</div>

        <div className="how-card">
          <FaRobot className="how-icon" />
          <h3>AI Analysis</h3>
          <p>Our AI model analyzes your image.</p>
        </div>

        <div className="arrow">➜</div>

        <div className="how-card">
          <FaFileMedical className="how-icon" />
          <h3>Get Report</h3>
          <p>Receive prediction results instantly.</p>
        </div>

        <div className="arrow">➜</div>

        <div className="how-card">
          <FaUserMd className="how-icon" />
          <h3>Consult Doctor</h3>
          <p>Book an appointment with our specialist.</p>
        </div>

      </div>

    </section>
  );
}

export default HowItWorks;