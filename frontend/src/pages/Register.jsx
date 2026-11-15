import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaHospital,
  FaUserShield,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
  FaKey,
} from "react-icons/fa";

import "../styles/Register.css";

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    role: "patient",
    superadmin_key: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (role) => {
    setForm({
      ...form,
      role,
      superadmin_key: role === "superadmin" ? form.superadmin_key : "",
      age: role === "patient" ? form.age : "",
      gender: role === "patient" ? form.gender : "",
    });
  };

  const getTitle = () => {
    switch (form.role) {
      case "patient":
        return "Patient Registration";
      case "hospital":
        return "Hospital Registration";
      case "superadmin":
        return "Super Admin Registration";
      default:
        return "Create Account";
    }
  };

  const getSubtitle = () => {
    switch (form.role) {
      case "patient":
        return "Register to use AI Skin Cancer Detection and consult doctors.";
      case "hospital":
        return "Register your hospital to onboard doctors and manage patient consultations.";
      case "superadmin":
        return "Register as a system super administrator with elevated access.";
      default:
        return "Register to use AI Skin Cancer Detection and consult doctors.";
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (form.role === "superadmin" && !form.superadmin_key.trim()) {
      alert("Super Admin Key is required");
      return;
    }

    try {
      let url = "http://127.0.0.1:8000/register";
      if (form.role === "superadmin") {
        url += `?superadmin_key=${encodeURIComponent(form.superadmin_key)}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await response.json();

      alert(data.message);

      if (data.success) {
        navigate("/login");
      }
    } catch (error) {
      alert("Registration Failed");
      console.error(error);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-icon">
          <FaUserPlus />
        </div>

        <h1>{getTitle()}</h1>

        <p>{getSubtitle()}</p>

        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${form.role === "patient" ? "active" : ""}`}
            onClick={() => handleRoleChange("patient")}
          >
            <FaUser />
            <span>Patient</span>
          </button>
          <button
            type="button"
            className={`role-btn ${form.role === "hospital" ? "active" : ""}`}
            onClick={() => handleRoleChange("hospital")}
          >
            <FaHospital />
            <span>Hospital</span>
          </button>
          <button
            type="button"
            className={`role-btn ${form.role === "superadmin" ? "active" : ""}`}
            onClick={() => handleRoleChange("superadmin")}
          >
            <FaUserShield />
            <span>Super Admin</span>
          </button>
        </div>

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <FaPhone className="input-icon" />
            <input
              type="tel"
              name="phone"
              placeholder="Mobile Number"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          {form.role === "patient" && (
            <>
              <div className="input-group">
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={form.age}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </>
          )}

          {form.role === "superadmin" && (
            <div className="input-group">
              <FaKey className="input-icon" />
              <input
                type="text"
                name="superadmin_key"
                placeholder="default: admin123"
                value={form.superadmin_key}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="input-group">
            <FaLock className="input-icon" />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
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

          <div className="input-group">
            <FaLock className="input-icon" />

            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <span
              className="eye-icon"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit">Register</button>
        </form>

        <div className="login-links">
          <p>
            Already have an account?
            <Link to="/login"> Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
