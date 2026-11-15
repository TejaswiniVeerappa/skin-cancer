import { FaBrain, FaClock, FaShieldAlt } from "react-icons/fa";
import "../styles/Home.css";

function FeatureCard() {
  return (
    <div className="features-container">

      <h2 className="feature-heading">
        Why Choose SkinCare AI?
      </h2>

      <div className="features">

        <div className="feature-card">
          <FaBrain className="feature-icon" />

          <h3>AI Detection</h3>

          <p>
            Advanced Artificial Intelligence detects skin cancer
            with high accuracy.
          </p>
        </div>

        <div className="feature-card">
          <FaClock className="feature-icon" />

          <h3>Fast Analysis</h3>

          <p>
            Upload an image and receive prediction
            results within seconds.
          </p>
        </div>

        <div className="feature-card">
          <FaShieldAlt className="feature-icon" />

          <h3>Secure Reports</h3>

          <p>
            Patient reports are encrypted and securely
            stored for future access.
          </p>
        </div>

      </div>

    </div>
  );
}

export default FeatureCard;