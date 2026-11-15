import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/History.css";

function History() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/history")
      .then((response) => setHistory(response.data))
      .catch((error) => console.error("Error:", error));
  }, []);

  const filteredHistory = history.filter((item) =>
    (item.image_path || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="history-page">

      <h1 className="history-title">
        AI Prediction History
      </h1>

      <input
        type="text"
        placeholder="🔍 Search by Image Name..."
        className="search-box"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredHistory.length === 0 ? (
        <p className="no-history">
          No prediction history found.
        </p>
      ) : (
        <table className="history-table">

          <thead>
            <tr>
              <th>#</th>
              <th>Patient Name</th>
              <th>Image</th>
              <th>Prediction</th>
              <th>Confidence</th>
              <th>Risk Level</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>

            {filteredHistory.map((item, index) => {

              const riskLevel = item.risk_level || "Not Available";

              let riskClass = "risk";

              if (riskLevel.includes("Low")) {
                riskClass = "risk low";
              } else if (riskLevel.includes("Medium")) {
                riskClass = "risk medium";
              } else if (riskLevel.includes("High")) {
                riskClass = "risk high";
              }

              return (
                <tr key={item.id}>

                  <td>{index + 1}</td>

                  <td>{item.patient_name || "—"}</td>

                  <td>{item.image_path}</td>

                  <td>
                    <span
                      className={
                        item.prediction === "Benign"
                          ? "badge benign"
                          : "badge malignant"
                      }
                    >
                      {item.prediction}
                    </span>
                  </td>

                  <td>{item.confidence}%</td>

                  <td>
                    <span className={riskClass}>
                      {riskLevel}
                    </span>
                  </td>

                  <td>
                    {new Date(item.predicted_at).toLocaleString()}
                  </td>

                </tr>
              );

            })}

          </tbody>

        </table>
      )}

    </div>
  );
}

export default History;