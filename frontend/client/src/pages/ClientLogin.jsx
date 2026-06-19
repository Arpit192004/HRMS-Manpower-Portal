import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ClientLogin = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("client@hrms.com");
  const [password, setPassword] = useState("Client@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    if (user.role === "Client Approver") {
      return <Navigate to="/client/dashboard" replace />;
    }

    return (
      <div className="candidate-auth-page">
        <div className="candidate-auth-card">
          <div className="logo">CL</div>
          <h1>Client Portal</h1>
          <div className="error-message">
            You are logged in as {user.role}. Please logout before client login.
          </div>
          <button type="button" onClick={logout}>Logout</button>
          <p className="login-switch">
            <Link to="/">Back to website</Link>
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.role !== "Client Approver") {
        logout();
        setError("Only client accounts can login here.");
        return;
      }

      navigate("/client/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Client login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-auth-page">
      <form className="candidate-auth-card" onSubmit={handleSubmit}>
        <div className="logo">CL</div>
        <h1>Client Login</h1>
        <p>Track manpower jobs, candidates and assigned employees.</p>

        {error && <div className="error-message">{error}</div>}

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login as Client"}
        </button>

        <p className="login-switch">
          Admin/HR? <Link to="/login">Admin Login</Link>
        </p>
      </form>
    </div>
  );
};

export default ClientLogin;
