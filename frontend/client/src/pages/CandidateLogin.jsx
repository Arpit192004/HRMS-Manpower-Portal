import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const CandidateLogin = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (user) {
    return <Navigate to={user.role === "Candidate" ? "/candidate/jobs" : "/"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.role !== "Candidate") {
        logout();
        setError("Only candidate accounts can login here.");
        return;
      }

      navigate("/candidate/jobs");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Candidate login failed");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const { data } = await api.post("/auth/resend-verification", { email });
      setMessage(data.message || "Verification link sent if required.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to resend verification link");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="candidate-auth-page">
      <form className="candidate-auth-card" onSubmit={handleSubmit}>
        <div className="logo">CP</div>
        <h1>Candidate Login</h1>
        <p>Sign in with the email used during candidate registration.</p>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

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

        <button type="button" className="secondary-button" onClick={resendVerification} disabled={resending || !email}>
          {resending ? "Sending..." : "Resend Email Verification"}
        </button>

        <p className="login-switch">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

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
