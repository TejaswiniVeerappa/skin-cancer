import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    new_password: "",
    confirm_password: "",
    role: "patient",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (form.new_password !== form.confirm_password) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          new_password: form.new_password,
          role: form.role,
        }),
      });

      const data = await response.json();

      alert(data.message);

      if (data.success) {
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <div className="forgot-password-eyebrow">Secure Reset</div>
        <h2 className="forgot-password-title">Forgot Password</h2>
        <p className="forgot-password-copy">
          Reset the password for your patient, hospital, or super admin account by confirming the role and email on file.
        </p>

        <form onSubmit={handleReset} className="forgot-password-form">

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="forgot-password-select"
        >
          <option value="patient">Patient</option>
          <option value="hospital">Hospital</option>
          <option value="superadmin">Super Admin</option>
        </select>

        <input
          type="email"
          name="email"
          placeholder="Enter Registered Email"
          value={form.email}
          onChange={handleChange}
          required
          className="forgot-password-field"
        />

        <input
          type="password"
          name="new_password"
          placeholder="Enter New Password"
          value={form.new_password}
          onChange={handleChange}
          required
          className="forgot-password-field"
        />

        <input
          type="password"
          name="confirm_password"
          placeholder="Confirm New Password"
          value={form.confirm_password}
          onChange={handleChange}
          required
          className="forgot-password-field"
        />

        <button
          type="submit"
          className="forgot-password-button"
        >
          Reset Password
        </button>

        <p className="forgot-password-note">
          Use the same role you registered with. If you choose the wrong role, the reset will be rejected.
        </p>

      </form>
      </div>
    </div>
  );
}

export default ForgotPassword;