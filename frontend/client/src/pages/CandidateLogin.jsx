import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CandidateLogin = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === "Candidate" ? "/candidate/jobs" : "/"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      navigate(loggedInUser.role === "Candidate" ? "/candidate/jobs" : "/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Candidate login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-auth-page">
      <form className="candidate-auth-card" onSubmit={handleSubmit}>
        <div className="logo">CP</div>
        <h1>Candidate Login</h1>
        <p>Track jobs, applications and hiring status.</p>

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
          {loading ? "Signing in..." : "Login as Candidate"}
        </button>

        <p className="login-switch">
          New candidate? <Link to="/candidate/register">Create account</Link>
        </p>

        <p className="login-switch">
          Admin/HR? <Link to="/login">Admin Login</Link>
        </p>
      </form>
    </div>
  );
};

export default CandidateLogin;
