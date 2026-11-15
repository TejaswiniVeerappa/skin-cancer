import { FaUpload, FaArrowRight } from "react-icons/fa";
import "../styles/Home.css";

function Hero() {
  return (
    <section className="hero-section">

      <div className="hero-left">

        <h4>🩺 AI Powered Healthcare</h4>

        <h1>
          Early Skin Cancer
          <br />
          Detection Saves Lives
        </h1>

        <p>
          Upload a skin lesion image and get an AI-powered prediction
          within seconds. Fast, secure and accurate.
        </p>

        <div className="hero-buttons">

          <a href="/upload">
            <button className="upload-btn">
              <FaUpload /> Upload Image
            </button>
          </a>

          <a href="/appointment">
            <button className="learn-btn">
              Book Appointment <FaArrowRight />
            </button>
          </a>

        </div>

      </div>

      <div className="hero-right">
        <img
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700"
          alt="Doctor"
        />
      </div>

    </section>
  );
}

export default Hero;

