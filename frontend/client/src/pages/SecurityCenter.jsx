import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const passwordChecks = [
  ["8+ characters", (value) => value.length >= 8],
  ["Uppercase letter", (value) => /[A-Z]/.test(value)],
  ["Lowercase letter", (value) => /[a-z]/.test(value)],
  ["Number", (value) => /[0-9]/.test(value)],
  ["Special character", (value) => /[^A-Za-z0-9]/.test(value)]
];

const SecurityCenter = () => {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.patch("/auth/change-password", form);
      setSuccess("Password changed. Please login again with your new password.");
      setTimeout(logout, 1200);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Password change failed");
    } finally {
      setSaving(false);
    }
  };

  const logoutAllSessions = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/logout-all");
      setSuccess("All sessions logged out. Please login again.");
      setTimeout(logout, 1200);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to logout all sessions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Security Center</h1>
          <p>Control password strength, active sessions and account safety.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="security-grid">
        <article className="content-card security-card">
          <ShieldCheck size={32} />
          <h3>Account Protection</h3>
          <p>
            Your account is protected with JWT session versioning, brute-force lockout,
            secure reset tokens and password policy checks.
          </p>
          <dl>
            <div>
              <dt>Role</dt>
              <dd>{user?.role}</dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Not tracked yet"}</dd>
            </div>
            <div>
              <dt>Password changed</dt>
              <dd>{user?.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleString() : "Not tracked yet"}</dd>
            </div>
          </dl>
          <button className="secondary-button danger-action" onClick={logoutAllSessions} disabled={saving}>
            Logout all sessions
          </button>
        </article>

        <form className="content-card form-grid security-form" onSubmit={changePassword}>
          <label>
            Current Password
            <input
              type="password"
              value={form.currentPassword}
              onChange={(event) => updateField("currentPassword", event.target.value)}
              required
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              value={form.newPassword}
              onChange={(event) => updateField("newPassword", event.target.value)}
              required
            />
          </label>

          <div className="wide-field password-checklist">
            {passwordChecks.map(([label, check]) => (
              <span className={check(form.newPassword) ? "passed" : ""} key={label}>
                {check(form.newPassword) ? "✓" : "○"} {label}
              </span>
            ))}
          </div>

          <button className="primary-button" disabled={saving}>
            {saving ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default SecurityCenter;
