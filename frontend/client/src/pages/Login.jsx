import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@hrms.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getHomePath = (loggedInUser) => {
    return "/admin";
  };

  if (user) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);

      if (["Candidate", "Employee", "Client Approver"].includes(loggedInUser.role)) {
        logout();
        setError("Please use your dedicated portal login.");
        return;
      }

      navigate(getHomePath(loggedInUser));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo">HR</div>

        <h1>HRMS Manpower Portal</h1>
        <p>Sign in to manage your workforce</p>

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
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="login-switch">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <p className="login-switch">
          Candidate ho? <Link to="/candidate/login">Candidate Login</Link>
        </p>

        <p className="login-switch">
          Client ho? <Link to="/client/login">Client Portal</Link>
        </p>

        <p className="login-switch">
          Employee ho? <Link to="/employee/login">Employee Portal</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
