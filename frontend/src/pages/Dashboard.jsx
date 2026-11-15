import { useEffect, useMemo, useState } from "react";
import {
  FaUser,
  FaHospital,
  FaUserShield,
  FaCheck,
  FaTimes,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaClock,
  FaUserMd,
  FaTrash,
  FaPlus,
  FaImage,
  FaShieldAlt,
  FaChartBar
} from "react-icons/fa";
import api from "../services/api";
import "../styles/Dashboard.css";

function Dashboard() {

  const role = localStorage.getItem("role") || "patient";
  const fullName = localStorage.getItem("full_name") || "";

  const [stats, setStats] = useState({
    total_predictions: 0,
    benign: 0,
    malignant: 0,
    appointments: 0,
    total_users: 0,
    total_patients: 0,
    total_hospitals: 0,
    total_superadmins: 0,
    pending_apts: 0,
    approved_apts: 0,
    completed_apts: 0,
    cancelled_apts: 0,
  });

  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [editingHospitalId, setEditingHospitalId] = useState(null);

  const [newHospital, setNewHospital] = useState({
    name: "",
    email: "",
    password: "hospital123"
  });

  const isPatient = role === "patient";
  const isHospital = role === "hospital";
  const isSuperAdmin = role === "superadmin";
  const hospitalDoctors = useMemo(() => {
    const names = new Set();

    appointments.forEach((appointment) => {
      if (appointment.doctor) {
        names.add(appointment.doctor);
      }
    });

    return Array.from(names);
  }, [appointments]);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setStats(res.data))
      .catch((err) => console.log(err));

    if (isSuperAdmin || isHospital) {
      api
        .get("/users")
        .then((res) => setUsers(res.data))
        .catch((err) => console.log(err));

      api
        .get("/hospitals")
        .then((res) => setHospitals(res.data))
        .catch((err) => console.log(err));

      api
        .get("/predictions")
        .then((res) => setPredictions(res.data))
        .catch((err) => console.log(err));
    }

    if (isHospital || isSuperAdmin) {
      api
        .get("/appointments")
        .then((res) => {
          setAppointments(res.data);
          setStats((prev) => ({ ...prev, appointments: (res.data || []).length }));
        })
        .catch((err) => console.log(err));

      api
        .get("/patients")
        .then((res) => setPatients(res.data))
        .catch((err) => console.log(err));
    }
  }, [isSuperAdmin, isHospital]);

  const refreshAll = () => {
    if (isSuperAdmin) {
      api.get("/dashboard").then(r => setStats(r.data));
      api.get("/users").then(r => setUsers(r.data));
      api.get("/hospitals").then(r => setHospitals(r.data));
      api.get("/predictions").then(r => setPredictions(r.data));
    }
    if (isHospital || isSuperAdmin) {
      api.get("/appointments").then(r => {
        setAppointments(r.data);
        setStats((prev) => ({ ...prev, appointments: (r.data || []).length }));
      });
      api.get("/patients").then(r => setPatients(r.data));
    }
  };

  const updateAptStatus = (id, endpoint, actionName) => {
    api
      .put(`/${endpoint}/${id}`)
      .then((res) => {
        if (res.data.success) {
          alert(res.data.message);
          setAppointments((prev) =>
            prev.map((a) => a.id === id ? { ...a, status: actionName } : a)
          );
          api
            .get("/dashboard")
            .then((r) => setStats(r.data));
        }
      })
      .catch((e) => {
        alert("Action failed");
        console.error(e);
      });
  };

  const handleDeleteHospital = (id, name) => {
    if (!window.confirm(`Delete hospital "${name}" permanently?`)) return;
    api
      .delete(`/hospitals/${id}`)
      .then((res) => {
        alert(res.data.message);
        if (res.data.success) {
          setHospitals((prev) => prev.filter((h) => h.id !== id));
          refreshAll();
        }
      })
      .catch((e) => {
        alert("Failed to delete hospital");
        console.error(e);
      });
  };

  const handleDeleteUser = (id, name) => {
    if (!window.confirm(`Delete user "${name}" permanently?`)) return;
    api
      .delete(`/users/${id}`)
      .then((res) => {
        alert(res.data.message);
        if (res.data.success) {
          setUsers((prev) => prev.filter((u) => u.id !== id));
          refreshAll();
        }
      })
      .catch((e) => {
        alert("Failed to delete user");
        console.error(e);
      });
  };

  const handleAddHospital = (e) => {
    e.preventDefault();
    if (!newHospital.name || !newHospital.email) {
      alert("Please enter hospital name and email");
      return;
    }
    const request = editingHospitalId
      ? api.put(`/hospitals/${editingHospitalId}`, newHospital)
      : api.post("/hospitals", newHospital);

    request
      .then((res) => {
        alert(res.data.message);
        if (res.data.success) {
          setNewHospital({ name: "", email: "", password: "hospital123" });
          setEditingHospitalId(null);
          refreshAll();
        }
      })
      .catch((e) => {
        alert("Failed to add hospital");
        console.error(e);
      });
  };

  const handleEditHospital = (hospital) => {
    setEditingHospitalId(hospital.id);
    setNewHospital({
      name: hospital.name || "",
      email: hospital.email || "",
      password: "",
    });
    setActiveTab("hospitals");
  };

  const handleCancelHospitalEdit = () => {
    setEditingHospitalId(null);
    setNewHospital({ name: "", email: "", password: "hospital123" });
  };

  const getRoleIcon = () => {
    if (isSuperAdmin) return <FaUserShield />;
    if (isHospital) return <FaHospital />;
    return <FaUser />;
  };

  const getRoleTitle = () => {
    if (isSuperAdmin) return "Super Admin Dashboard";
    if (isHospital) return "Hospital Dashboard";
    return "Patient Dashboard";
  };

  const getWelcomeMessage = () => {
    if (isSuperAdmin)
      return "Manage hospitals, users, predictions, appointments and system-wide reports from one place.";
    if (isHospital)
      return "View patients, approve / reject / complete appointments, and track consultations.";
    return "Upload skin lesion images, view predictions, track your health reports, and book appointments.";
  };

  const hospitalFeatures = [
    { text: "View Patients", icon: "✅" },
    { text: "View Booked Appointments", icon: "✅" },
    { text: "Approve Appointment", icon: "✅" },
    { text: "Reject Appointment", icon: "✅" },
    { text: "Mark Completed", icon: "✅" }
  ];

  const superAdminFeatures = [
    { text: "Add Hospital", icon: "✅" },
    { text: "Delete Hospital", icon: "✅" },
    { text: "View All Patients", icon: "✅" },
    { text: "View All Doctors (Hospitals)", icon: "✅" },
    { text: "View All Predictions", icon: "✅" },
    { text: "View Reports", icon: "✅" }
  ];

  return (
    <div className="dashboard">

      <h1 className="dashboard-title">
        {getRoleIcon()} {getRoleTitle()}
      </h1>

      <p className="dashboard-subtitle">
        {getWelcomeMessage()}
      </p>

      {/* Tabs */}
      {(isHospital || isSuperAdmin) && (
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            📊 Overview
          </button>

          <button
            className={`tab-btn ${activeTab === "patients" ? "active" : ""}`}
            onClick={() => setActiveTab("patients")}
          >
            🧑 Patients ({patients.length})
          </button>

          <button
            className={`tab-btn ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            📅 Appointments ({appointments.length})
          </button>

          {(isSuperAdmin || isHospital) && (
            <>
              <button
                className={`tab-btn ${activeTab === "hospitals" ? "active" : ""}`}
                onClick={() => setActiveTab("hospitals")}
              >
                🏥 Hospitals ({hospitals.length})
              </button>
              <button
                className={`tab-btn ${activeTab === "predictions" ? "active" : ""}`}
                onClick={() => setActiveTab("predictions")}
              >
                🔬 Predictions ({predictions.length})
              </button>
              <button
                className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                👥 Users ({users.length})
              </button>
              <button
                className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
                onClick={() => setActiveTab("reports")}
              >
                📈 Reports
              </button>
            </>
          )}
        </div>
      )}

      {/* ========== OVERVIEW TAB ========== */}
      {(activeTab === "stats" || isPatient) && (
        <>
          <div className="dashboard-cards">

            <div className="dashboard-card total">
              <div className="card-icon">📊</div>
              <h3>Total Predictions</h3>
              <h2>{stats.total_predictions}</h2>
            </div>

            <div className="dashboard-card benign">
              <div className="card-icon">🟢</div>
              <h3>Benign Cases</h3>
              <h2>{stats.benign}</h2>
            </div>

            <div className="dashboard-card malignant">
              <div className="card-icon">🔴</div>
              <h3>Malignant Cases</h3>
              <h2>{stats.malignant}</h2>
            </div>

            <div className="dashboard-card appointment">
              <div className="card-icon">📅</div>
              <h3>Appointments</h3>
              <h2>{stats.appointments}</h2>
            </div>

            {isHospital && (
              <>
                <div className="dashboard-card approved-card">
                  <div className="card-icon">✅</div>
                  <h3>Approved</h3>
                  <h2>{stats.approved_apts}</h2>
                </div>
                <div className="dashboard-card pending-card">
                  <div className="card-icon">⏳</div>
                  <h3>Pending</h3>
                  <h2>{stats.pending_apts}</h2>
                </div>
                <div className="dashboard-card completed-card">
                  <div className="card-icon">✔️</div>
                  <h3>Completed</h3>
                  <h2>{stats.completed_apts}</h2>
                </div>
                <div className="dashboard-card rejected-card">
                  <div className="card-icon">❌</div>
                  <h3>Rejected / Cancelled</h3>
                  <h2>{stats.cancelled_apts}</h2>
                </div>
              </>
            )}

            {isSuperAdmin && (
              <>
                <div className="dashboard-card superadmin-card">
                  <div className="card-icon">👥</div>
                  <h3>Total Users</h3>
                  <h2>{stats.total_users || users.length}</h2>
                </div>
                <div className="dashboard-card patient-card">
                  <div className="card-icon">🧑‍⚕️</div>
                  <h3>Patients</h3>
                  <h2>{stats.total_patients}</h2>
                </div>
                <div className="dashboard-card hospital-card">
                  <div className="card-icon">🏥</div>
                  <h3>Hospitals</h3>
                  <h2>{stats.total_hospitals}</h2>
                </div>
                <div className="dashboard-card admin-card">
                  <div className="card-icon"><FaShieldAlt /></div>
                  <h3>Super Admins</h3>
                  <h2>{stats.total_superadmins}</h2>
                </div>
              </>
            )}

          </div>

          <div className="dashboard-info">

            <div className="info-box">
              <h2>Welcome 👋 {fullName && `, ${fullName}`}</h2>
              <p>{getWelcomeMessage()}</p>
            </div>

            {/* Hospital Features checklist */}
            {isHospital && (
              <div className="info-box">
                <h2>Hospital Permissions</h2>
                <ul className="features-list">
                  {hospitalFeatures.map((f, i) => (
                    <li key={i} className="feature-item">
                      <span className="feature-icon">{f.icon}</span>
                      <span className="feature-text">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isHospital && (
              <div className="info-box">
                <h2>Hospital Doctors</h2>
                {hospitalDoctors.length === 0 ? (
                  <p>No doctors assigned yet.</p>
                ) : (
                  <ul className="features-list">
                    {hospitalDoctors.map((doctor, index) => (
                      <li key={index} className="feature-item">
                        <span className="feature-icon">🩺</span>
                        <span className="feature-text">{doctor}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Super Admin Features checklist */}
            {isSuperAdmin && (
              <div className="info-box">
                <h2>Super Admin Permissions</h2>
                <ul className="features-list">
                  {superAdminFeatures.map((f, i) => (
                    <li key={i} className="feature-item">
                      <span className="feature-icon">{f.icon}</span>
                      <span className="feature-text">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="info-box">
              <h2>Health Summary</h2>
              <p>Total Predictions : {stats.total_predictions}</p>
              <p>Benign Cases : {stats.benign}</p>
              <p>Malignant Cases : {stats.malignant}</p>
              <p>Total Appointments : {stats.appointments}</p>
              {isHospital && (
                <>
                  <p>Pending : {stats.pending_apts}</p>
                  <p>Approved : {stats.approved_apts}</p>
                  <p>Completed : {stats.completed_apts}</p>
                  <p>Rejected / Cancelled : {stats.cancelled_apts}</p>
                </>
              )}
              {isSuperAdmin && (
                <>
                  <p>Total Registered Users: {stats.total_users || users.length}</p>
                  <p>Patients: {stats.total_patients}</p>
                  <p>Hospitals: {stats.total_hospitals}</p>
                  <p>Super Admins: {stats.total_superadmins}</p>
                </>
              )}
            </div>

          </div>
        </>
      )}

      {/* ========== PATIENTS TAB ========== */}
      {activeTab === "patients" && (isHospital || isSuperAdmin) && (
        <div className="table-container">
          <h2 className="table-title">🧑 Patients Registered in System</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr><td colSpan="4" className="empty-row">No patients yet.</td></tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td><strong>{p.full_name}</strong></td>
                      <td>{p.email}</td>
                      <td>
                        <span className="role-tag patient-tag"><FaUser /> PATIENT</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== APPOINTMENTS TAB ========== */}
      {activeTab === "appointments" && (isHospital || isSuperAdmin) && (
        <div className="table-container">
          <h2 className="table-title">📅 All Appointments</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Doctor</th>
                  <th>Date &amp; Time</th>
                  <th>Symptoms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan="8" className="empty-row">No appointments yet.</td></tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id}>
                      <td>#{a.id}</td>
                      <td>
                        <strong>{a.patient_name}</strong>
                        <div className="subtext">Age: {a.age} &middot; {a.gender}</div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <div><FaEnvelope /> {a.email}</div>
                          <div><FaPhone /> {a.phone}</div>
                        </div>
                      </td>
                      <td><FaUserMd /> {a.doctor}</td>
                      <td>
                        <div><FaCalendar /> {a.appointment_date}</div>
                        <div className="subtext"><FaClock /> {a.appointment_time}</div>
                      </td>
                      <td className="symptoms-cell">{a.symptoms || "\u2014"}</td>
                      <td>
                        <span className={`status-tag status-${String(a.status || "pending").toLowerCase()}`}>
                          {a.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {(a.status === "Pending" || !a.status) && (
                            <>
                              <button
                                className="action-btn approve-btn"
                                onClick={() => updateAptStatus(a.id, "approve-appointment", "Approved")}
                                title="Approve Appointment"
                              >
                                <FaCheck /> Approve
                              </button>
                              <button
                                className="action-btn reject-btn"
                                onClick={() => updateAptStatus(a.id, "reject-appointment", "Rejected")}
                                title="Reject Appointment"
                              >
                                <FaTimes /> Reject
                              </button>
                            </>
                          )}
                          {(a.status === "Approved" || a.status === "Pending" || !a.status) && (
                            <button
                              className="action-btn complete-btn"
                              onClick={() => updateAptStatus(a.id, "complete-appointment", "Completed")}
                              title="Mark as Completed"
                            >
                              <FaCheck /> Done
                            </button>
                          )}
                          {(a.status !== "Completed" && a.status !== "Cancelled" && a.status !== "Rejected") && (
                            <button
                              className="action-btn cancel-btn"
                              onClick={() => updateAptStatus(a.id, "cancel-appointment", "Cancelled")}
                              title="Cancel Appointment"
                            >
                              <FaTimes /> Cancel
                            </button>
                          )}
                          {(a.status === "Completed" || a.status === "Cancelled" || a.status === "Rejected") && (
                            <span className="no-actions">\u2014</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== HOSPITALS TAB ========== */}
      {activeTab === "hospitals" && isSuperAdmin && (
        <>
          <div className="table-container">
            <h2 className="table-title">
              {editingHospitalId ? "✏️ Edit Hospital" : "🏥 Add Hospital"}
            </h2>
            <form onSubmit={handleAddHospital} className="add-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Hospital Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo Hospitals"
                    value={newHospital.name}
                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="hospital@example.com"
                    value={newHospital.email}
                    onChange={(e) => setNewHospital({ ...newHospital, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="text"
                    placeholder="hospital123"
                    value={newHospital.password}
                    onChange={(e) => setNewHospital({ ...newHospital, password: e.target.value })}
                  />
                </div>
                <div className="form-group submit-group">
                  <button type="submit" className="add-btn">
                    <FaPlus /> {editingHospitalId ? "Update Hospital" : "Add Hospital"}
                  </button>
                  {editingHospitalId && (
                    <button
                      type="button"
                      className="action-btn cancel-btn"
                      onClick={handleCancelHospitalEdit}
                      style={{ marginTop: "10px" }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          <div className="table-container">
            <h2 className="table-title">🏥 All Hospitals ({hospitals.length})</h2>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hospital Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.length === 0 ? (
                    <tr><td colSpan="5" className="empty-row">No hospitals added yet.</td></tr>
                  ) : (
                    hospitals.map((h) => (
                      <tr key={h.id}>
                        <td>#{h.id}</td>
                        <td><strong>{h.name}</strong></td>
                        <td>{h.email}</td>
                        <td><span className="role-tag hospital-tag"><FaHospital /> HOSPITAL</span></td>
                        <td>
                          <button
                            className="action-btn approve-btn"
                            onClick={() => handleEditHospital(h)}
                            style={{ marginRight: "8px" }}
                          >
                            <FaPlus /> Edit
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteHospital(h.id, h.name)}
                          >
                            <FaTrash /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========== PREDICTIONS TAB ========== */}
      {activeTab === "predictions" && (isSuperAdmin || isHospital) && (
        <div className="table-container">
          <h2 className="table-title">🔬 All AI Predictions ({predictions.length})</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Image</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                  <th>Risk Level</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {predictions.length === 0 ? (
                  <tr><td colSpan="7" className="empty-row">No predictions yet.</td></tr>
                ) : (
                  predictions.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>
                        <strong>{p.patient_name ? p.patient_name : `#${p.user_id}`}</strong>
                      </td>
                      <td>
                        <div className="img-cell">
                          <FaImage />
                          <span className="img-name">{p.image_path}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-tag ${p.prediction === "Benign" ? "status-completed" : "status-cancelled"}`}>
                          {p.prediction}
                        </span>
                      </td>
                      <td>{p.confidence}%</td>
                      <td>
                        <span className={`risk-tag risk-${String(p.risk_level || "low").toLowerCase().replace(/\s+/g, "-")}`}>
                          {p.risk_level}
                        </span>
                      </td>
                      <td>{String(p.predicted_at || "").slice(0, 19)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== USERS TAB ========== */}
      {activeTab === "users" && isSuperAdmin && (
        <div className="table-container">
          <h2 className="table-title">👥 All Registered Users ({users.length})</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="5" className="empty-row">No users found.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td><strong>{u.full_name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-tag ${u.role}-tag`}>
                          {u.role === "superadmin" && <FaUserShield />}
                          {u.role === "hospital" && <FaHospital />}
                          {u.role === "patient" && <FaUser />}
                          {" "}{String(u.role).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== REPORTS TAB ========== */}
      {activeTab === "reports" && isSuperAdmin && (
        <div className="table-container">
          <h2 className="table-title">📈 System Reports</h2>

          <div className="reports-grid">

            <div className="report-card">
              <div className="report-icon"><FaChartBar /></div>
              <h3>User Statistics</h3>
              <div className="report-stat"><span>Total Users</span><strong>{stats.total_users || users.length}</strong></div>
              <div className="report-stat"><span>Patients</span><strong>{stats.total_patients}</strong></div>
              <div className="report-stat"><span>Hospitals</span><strong>{stats.total_hospitals}</strong></div>
              <div className="report-stat"><span>Super Admins</span><strong>{stats.total_superadmins}</strong></div>
            </div>

            <div className="report-card">
              <div className="report-icon">🔬</div>
              <h3>Prediction Reports</h3>
              <div className="report-stat"><span>Total Predictions</span><strong>{stats.total_predictions}</strong></div>
              <div className="report-stat"><span>Benign</span><strong>{stats.benign}</strong></div>
              <div className="report-stat"><span>Malignant</span><strong>{stats.malignant}</strong></div>
              <div className="report-stat">
                <span>Benign Rate</span>
                <strong>
                  {stats.total_predictions
                    ? `${Math.round((stats.benign / stats.total_predictions) * 100)}%`
                    : "0%"}
                </strong>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon">📅</div>
              <h3>Appointment Reports</h3>
              <div className="report-stat"><span>Total Appointments</span><strong>{stats.appointments}</strong></div>
              <div className="report-stat"><span>Pending</span><strong>{stats.pending_apts}</strong></div>
              <div className="report-stat"><span>Approved</span><strong>{stats.approved_apts}</strong></div>
              <div className="report-stat"><span>Completed</span><strong>{stats.completed_apts}</strong></div>
              <div className="report-stat"><span>Rejected / Cancelled</span><strong>{stats.cancelled_apts}</strong></div>
            </div>

            <div className="report-card">
              <div className="report-icon">💡</div>
              <h3>Highlights</h3>
              <ul className="reports-list">
                <li>AI-based skin lesion prediction using CNN model.</li>
                <li>Role-based access for Patients, Hospitals &amp; Super Admins.</li>
                <li>Full appointment lifecycle: Approve \u2192 Reject \u2192 Complete \u2192 Cancel.</li>
                <li>Hospital onboarding (Super Admin can add / delete hospitals).</li>
                <li>Prediction history with confidence scores and risk levels.</li>
              </ul>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
