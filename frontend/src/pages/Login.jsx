import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUserMd,
  FaHospital,
  FaUserShield,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
} from "react-icons/fa";

import "../styles/Login.css";

const roleContent = {
  patient: {
    title: "Patient Login",
    description:
      "Login to access AI Skin Cancer Detection and your medical reports.",
  },
  hospital: {
    title: "Hospital Login",
    description:
      "Login to manage patients, view reports, and oversee hospital operations.",
  },
  superadmin: {
    title: "Super Admin Login",
    description:
      "Login to manage the entire platform, users, and system configurations.",
  },
};

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "patient",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleSelect = (role) => {
    setForm({
      ...form,
      role,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      alert(data.message);

      if (data.success) {
        if (form.role !== data.role) {
          alert(
            `Role mismatch! You selected ${form.role} but your account role is ${data.role}.`
          );
        }

        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("role", data.role || form.role);
        localStorage.setItem("user_id", data.user_id || "");
        localStorage.setItem("hospital_id", data.hospital_id || "");
        localStorage.setItem("full_name", data.full_name || "");
        localStorage.setItem("email", data.email || form.email);
        localStorage.setItem("auth_token", data.access_token || "");

        const effectiveRole = data.role || form.role;
        if (effectiveRole === "superadmin" || effectiveRole === "hospital") {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  const currentContent = roleContent[form.role] || roleContent.patient;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          {form.role === "patient" && <FaUserMd />}
          {form.role === "hospital" && <FaHospital />}
          {form.role === "superadmin" && <FaUserShield />}
        </div>

        <h1>{currentContent.title}</h1>

        <p>{currentContent.description}</p>

        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${form.role === "patient" ? "active" : ""}`}
            onClick={() => handleRoleSelect("patient")}
          >
            <FaUser />
            <span>Patient</span>
          </button>
          <button
            type="button"
            className={`role-btn ${form.role === "hospital" ? "active" : ""}`}
            onClick={() => handleRoleSelect("hospital")}
          >
            <FaHospital />
            <span>Hospital</span>
          </button>
          <button
            type="button"
            className={`role-btn ${form.role === "superadmin" ? "active" : ""}`}
            onClick={() => handleRoleSelect("superadmin")}
          >
            <FaUserShield />
            <span>Super Admin</span>
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter Password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="remember-section">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember Me
            </label>
          </div>

          <button type="submit">Login</button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password" className="register-link">
            Forgot Password?
          </Link>

          <p>
            Don't have an account?{" "}
            <Link to="/register" className="register-link">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
