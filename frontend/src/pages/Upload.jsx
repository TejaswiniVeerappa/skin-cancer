import { useState } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";
import jsPDF from "jspdf";
import api from "../services/api";
import "../styles/Upload.css";

function Upload() {
  const role = localStorage.getItem("role") || "patient";
  const storedFullName = localStorage.getItem("full_name") || "";
  const [image, setImage] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const displayName = role === "hospital"
    ? (patientName.trim() || storedFullName || "Patient")
    : (storedFullName || "Patient");
  const reportDate = new Date().toLocaleString();

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      setImage(URL.createObjectURL(file));
      setImageDataUrl("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result || "");
      };
      reader.readAsDataURL(file);
      setPrediction("");
      setConfidence("");
      setRiskLevel("");
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }


    if (role === "hospital" && !patientName.trim()) {
      alert("Please enter the patient name.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    if (patientName && patientName.trim()) {
      formData.append("patient_name", patientName.trim());
    }

    try {
      setLoading(true);

      const response = await api.post("/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setPrediction(response.data.prediction);
      setConfidence(response.data.confidence);
      setRiskLevel(response.data.risk_level);

    } catch (error) {
      console.error(error);
      alert("Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Download PDF
  // ==========================

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    const isBenign = prediction === "Benign";
    const imageType = selectedFile?.type === "image/png" ? "PNG" : "JPEG";

    let cursorY = 18;

    doc.setFillColor(244, 248, 252);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(27, 75, 117);
    doc.text("AI Skin Cancer Detection Report", margin, cursorY);

    cursorY += 6;
    doc.setDrawColor(184, 198, 212);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);

    cursorY += 14;
    doc.setFontSize(12);
    doc.setTextColor(40, 52, 68);
    doc.text(`Name: ${displayName}`, margin, cursorY);
    doc.text(`Role: ${role.charAt(0).toUpperCase() + role.slice(1)}`, pageWidth - margin, cursorY, { align: "right" });

    cursorY += 8;
    doc.text(`Date: ${reportDate}`, margin, cursorY);

    cursorY += 14;
    if (imageDataUrl) {
      doc.setDrawColor(210, 220, 230);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, cursorY, contentWidth, 86, 4, 4, "FD");
      doc.setFontSize(11);
      doc.setTextColor(69, 84, 103);
      doc.text("Scanned Photo", margin + 6, cursorY + 8);
      doc.addImage(imageDataUrl, imageType, margin + 6, cursorY + 12, 52, 62);

      const imageCaptionX = margin + 64;
      doc.setFont("helvetica", "normal");
      doc.text("Uploaded lesion image is included for clinical reference.", imageCaptionX, cursorY + 18, {
        maxWidth: contentWidth - 60,
      });
      doc.text(`Prediction confidence: ${confidence}`, imageCaptionX, cursorY + 34);
      doc.text(`Risk level: ${riskLevel}`, imageCaptionX, cursorY + 48);
      cursorY += 96;
    }

    const drawSection = (title, bodyLines) => {
      doc.setDrawColor(210, 220, 230);
      doc.setFillColor(255, 255, 255);
      const sectionHeight = 14 + bodyLines.length * 7 + 10;
      doc.roundedRect(margin, cursorY, contentWidth, sectionHeight, 4, 4, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(27, 75, 117);
      doc.text(title, margin + 6, cursorY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(40, 52, 68);
      bodyLines.forEach((line, index) => {
        doc.text(line, margin + 8, cursorY + 20 + index * 7);
      });
      cursorY += sectionHeight + 8;
    };

    drawSection("Clinical Summary", [
      `Prediction: ${prediction}`,
      `Confidence: ${confidence}`,
      `Risk Level: ${riskLevel}`,
    ]);

    drawSection("Recommendation", isBenign
      ? [
          "Skin lesion appears non-cancerous.",
          "Continue regular monitoring.",
          "Use sunscreen SPF 30+.",
          "Consult a dermatologist if the lesion changes."
        ]
      : [
          "High probability of skin cancer.",
          "Consult a dermatologist immediately.",
          "Do not ignore changes in the lesion.",
          "Further clinical examination is recommended."
        ]
    );

    drawSection("ABCDE Rule", [
      "A - Asymmetry",
      "B - Border irregularity",
      "C - Color variation",
      "D - Diameter greater than 6 mm",
      "E - Evolution (changes over time)",
    ]);

    doc.setFontSize(10);
    doc.setTextColor(110, 122, 136);
    doc.text("Generated by AI Skin Cancer Detection System", margin, doc.internal.pageSize.getHeight() - 12);

    doc.save("Skin_Cancer_Report.pdf");
  };

  return (
    <div className="upload-page">

      <div className="upload-card">

        <FaCloudUploadAlt className="upload-icon" />

        <h1>Upload Skin Image</h1>

        <p>
          Upload a clear image of the skin lesion for AI-powered analysis.
        </p>

        

        <label className="upload-box">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          <span>Choose Image</span>
        </label>

        <div className="input-group">
          <input
            type="text"
            placeholder={role === "hospital" ? "Enter patient name" : "Enter patient name (optional)"}
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />
        </div>

        {image && (
          <div className="preview-section">
            <img
              src={image}
              alt="Preview"
              className="preview-image"
            />
          </div>
        )}

        <button
          className="analyze-btn"
          onClick={handleAnalyze}
        >
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>

        {prediction && (
          <div className="result-box">

            <div className="result-header">
              <div>
                <p className="result-kicker">Diagnostic Report</p>
                <h2>AI Diagnosis Report</h2>
                <p className="result-subtitle">
                  Structured skin lesion analysis with the scanned image, summary, and recommendation.
                </p>
              </div>
              <div className="result-badge">{role === "hospital" ? "Hospital View" : "Patient View"}</div>
            </div>

            <div className="report-meta-row">
              <div className="meta-item">
                <span>Patient</span>
                <strong>{displayName}</strong>
              </div>
              <div className="meta-item">
                <span>Role</span>
                <strong>{role.charAt(0).toUpperCase() + role.slice(1)}</strong>
              </div>
              <div className="meta-item">
                <span>Date</span>
                <strong>{reportDate}</strong>
              </div>
            </div>

            {image && (
              <div className="report-image-wrap">
                <div className="report-image-label">Scanned Photo</div>
                <img
                  src={image}
                  alt="Scanned lesion preview"
                  className="report-image"
                />
              </div>
            )}

            <div className="report-summary-grid">
              <div className="summary-item">
                <span>Prediction</span>
                <strong>{prediction}</strong>
              </div>
              <div className="summary-item">
                <span>Confidence</span>
                <strong>{confidence}</strong>
              </div>
              <div className="summary-item">
                <span>Risk Level</span>
                <strong>{riskLevel}</strong>
              </div>
            </div>

            <div className="report-section">
              <h3>Clinical Notes</h3>

              {prediction === "Benign" ? (
                <ul>
                  <li>Skin lesion appears non-cancerous.</li>
                  <li>Continue regular monitoring.</li>
                  <li>Use sunscreen (SPF 30+).</li>
                  <li>Visit a dermatologist if the lesion changes.</li>
                </ul>
              ) : (
                <ul>
                  <li>High probability of skin cancer.</li>
                  <li>Consult a dermatologist immediately.</li>
                  <li>Do not ignore changes in the lesion.</li>
                  <li>Further clinical examination is recommended.</li>
                </ul>
              )}
            </div>

            <div className="report-section report-section-muted">
              <h3>ABCDE Rule</h3>

              <ul>
                <li>A - Asymmetry</li>
                <li>B - Border irregularity</li>
                <li>C - Color variation</li>
                <li>D - Diameter greater than 6 mm</li>
                <li>E - Evolution (changes over time)</li>
              </ul>
            </div>

            <div className="report-footer-note">
              This report is intended for both hospital and patient records and can be downloaded as a PDF.
            </div>

            <button
              className="download-btn"
              onClick={downloadPDF}
            >
              📄 Download AI Report
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

export default Upload;