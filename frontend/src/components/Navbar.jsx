import { FaHeartbeat, FaUser, FaHospital, FaUserShield } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn =
    localStorage.getItem("loggedIn") === "true" &&
    Boolean(localStorage.getItem("auth_token"));
  const role = localStorage.getItem("role") || "patient";
  const fullName = localStorage.getItem("full_name") || "";
  const firstName = fullName ? fullName.split(" ")[0] : "";

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("hospital_id");
    localStorage.removeItem("full_name");
    localStorage.removeItem("email");
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  const getBadgeIcon = () => {
    if (role === "superadmin") return <FaUserShield />;
    if (role === "hospital") return <FaHospital />;
    return <FaUser />;
  };

  const getBadgeClass = () => {
    if (role === "superadmin") return "superadmin-badge";
    if (role === "hospital") return "hospital-badge";
    return "patient-badge";
  };

  const capitalizeRole = (r) => r.charAt(0).toUpperCase() + r.slice(1);

  return (
    <nav className="navbar">
      <div className="logo">
        <FaHeartbeat className="logo-icon" />
        <h2>SkinCare AI</h2>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/">Home</Link>
        </li>

        <li>
          <Link to="/about">About</Link>
        </li>

        {isLoggedIn ? (
          <>
            {(role === "patient" || role === "hospital") && (
              <li>
                <Link to="/upload">Upload</Link>
              </li>
            )}

            {role === "patient" && (
              <>
                <li>
                  <Link to="/history">History</Link>
                </li>
                <li>
                  <Link to="/appointment">Appointment</Link>
                </li>
              </>
            )}

            {(role === "hospital" || role === "superadmin") && (
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
            )}

            {firstName && (
              <li className="user-greeting-container">
                <span className="user-greeting">Hi {firstName}</span>
                <span className={`role-badge ${getBadgeClass()}`}>
                  {getBadgeIcon()}
                  <span>{capitalizeRole(role)}</span>
                </span>
              </li>
            )}

            <li>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
