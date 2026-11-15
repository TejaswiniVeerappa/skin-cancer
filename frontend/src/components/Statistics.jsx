import { FaBullseye, FaImages, FaBolt, FaSmile } from "react-icons/fa";
import "../styles/Home.css";

function Statistics() {
  return (
    <section className="stats-section">

      <h2 className="stats-title">
        AI Performance Statistics
      </h2>

      <p className="stats-subtitle">
        Our AI system provides fast, reliable and accurate skin cancer detection.
      </p>

      <div className="stats-container">

        <div className="stat-card">
          <FaBullseye className="stat-icon" />
          <h3>98.7%</h3>
          <p>AI Accuracy</p>
        </div>

        <div className="stat-card">
          <FaImages className="stat-icon" />
          <h3>10,000+</h3>
          <p>Images Analysed</p>
        </div>

        <div className="stat-card">
          <FaBolt className="stat-icon" />
          <h3>2 Sec</h3>
          <p>Average Prediction Time</p>
        </div>

        <div className="stat-card">
          <FaSmile className="stat-icon" />
          <h3>95%</h3>
          <p>Patient Satisfaction</p>
        </div>

      </div>

    </section>
  );
}

export default Statistics;