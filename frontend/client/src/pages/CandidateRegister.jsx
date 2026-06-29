import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const CandidateRegister = () => {
  const { user, registerCandidate } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (user) {
    return <Navigate to={user.role === "Candidate" ? "/candidate/jobs" : "/"} replace />;
  }

  const handleChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await registerCandidate(form);
      setMessage(data.message || "Account created. Please verify your email before login.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Candidate registration failed");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const { data } = await api.post("/auth/resend-verification", { email: form.email });
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
        <h1>Create Candidate Account</h1>
        <p>Create your account with a real email. We will send a verification link before login.</p>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <label>Full Name</label>
        <input
          value={form.name}
          onChange={(event) => handleChange("name", event.target.value)}
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(event) => handleChange("email", event.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          minLength={6}
          value={form.password}
          onChange={(event) => handleChange("password", event.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account & Verify Email"}
        </button>

        <button type="button" className="secondary-button" onClick={resendVerification} disabled={resending || !form.email}>
          {resending ? "Sending..." : "Resend Verification Link"}
        </button>

        <p className="login-switch">
          Already registered? <Link to="/candidate/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default CandidateRegister;
