import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isEmployeeRole } from "../utils/roles";

const EmployeeLogin = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    if (isEmployeeRole(user.role)) {
      return <Navigate to="/employee/dashboard" replace />;
    }

    return (
      <div className="candidate-auth-page">
        <div className="candidate-auth-card">
          <div className="logo">EP</div>
          <h1>Employee Portal</h1>
          <div className="error-message">
            You are logged in as {user.role}. Please logout before employee login.
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

      if (!isEmployeeRole(loggedInUser.role)) {
        logout();
        setError("Only employee accounts can login here.");
        return;
      }

      navigate("/employee/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Employee login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-auth-page">
      <form className="candidate-auth-card" onSubmit={handleSubmit}>
        <div className="logo">EP</div>
        <h1>Employee Login</h1>
        <p>Sign in with your official employee email account.</p>

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
          {loading ? "Signing in..." : "Login as Employee"}
        </button>

        <p className="login-switch">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <p className="login-switch">
          Admin/HR? <Link to="/login">Admin Login</Link>
        </p>
      </form>
    </div>
  );
};

export default EmployeeLogin;
