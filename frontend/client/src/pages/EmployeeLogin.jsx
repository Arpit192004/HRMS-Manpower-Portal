import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EmployeeLogin = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("employee@hrms.com");
  const [password, setPassword] = useState("Employee@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    if (user.role === "Employee") {
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

      if (loggedInUser.role !== "Employee") {
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
        <p>Open your attendance, leave, expense and payroll portal.</p>

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
