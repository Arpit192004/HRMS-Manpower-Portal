import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CandidateRegister = () => {
  const { user, registerCandidate } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === "Candidate" ? "/candidate/jobs" : "/"} replace />;
  }

  const handleChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerCandidate(form);
      navigate("/candidate/jobs");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Candidate registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-auth-page">
      <form className="candidate-auth-card" onSubmit={handleSubmit}>
        <div className="logo">CP</div>
        <h1>Create Candidate Account</h1>
        <p>Register once and apply for open company roles.</p>

        {error && <div className="error-message">{error}</div>}

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
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p className="login-switch">
          Already registered? <Link to="/candidate/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default CandidateRegister;
