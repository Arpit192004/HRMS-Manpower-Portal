import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState("Verifying your email...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.post(`/auth/verify-email/${token}`);
        setMessage(data.message || "Email verified successfully. You can login now.");
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Email verification failed");
        setMessage("");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="candidate-auth-page">
      <div className="candidate-auth-card">
        <div className="logo">OK</div>
        <h1>Email Verification</h1>
        <p>Secure account activation for your Niyukti login.</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <Link className="primary-button" to="/candidate/login">
          {loading ? "Please wait..." : "Go to Candidate Login"}
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
