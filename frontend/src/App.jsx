import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import Upload from "./pages/Upload";
import History from "./pages/History";
import Appointment from "./pages/Appointment";
import Dashboard from "./pages/Dashboard";
import DoctorDetails from "./pages/DoctorDetails";

function RequireAuth({ children, allowedRoles }) {
  const isLoggedIn =
    localStorage.getItem("loggedIn") === "true" &&
    Boolean(localStorage.getItem("auth_token"));
  const role = localStorage.getItem("role") || "patient";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    alert(`This page is only accessible to: ${allowedRoles.join(", ").toUpperCase()}`);
    if (role === "superadmin" || role === "hospital") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

function RedirectIfLoggedIn({ children }) {
  const isLoggedIn =
    localStorage.getItem("loggedIn") === "true" &&
    Boolean(localStorage.getItem("auth_token"));
  if (isLoggedIn) {
    const role = localStorage.getItem("role") || "patient";
    if (role === "patient") return <Navigate to="/" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        <Route
          path="/upload"
          element={
            <RequireAuth allowedRoles={["patient", "hospital"]}>
              <Upload />
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth allowedRoles={["patient"]}>
              <History />
            </RequireAuth>
          }
        />
        <Route
          path="/appointment"
          element={
            <RequireAuth allowedRoles={["patient"]}>
              <Appointment />
            </RequireAuth>
          }
        />
        <Route
          path="/doctor/:id"
          element={
            <RequireAuth allowedRoles={["patient"]}>
              <DoctorDetails />
            </RequireAuth>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth allowedRoles={["hospital", "superadmin"]}>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/login"
          element={
            <RedirectIfLoggedIn>
              <Login />
            </RedirectIfLoggedIn>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfLoggedIn>
              <Register />
            </RedirectIfLoggedIn>
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
