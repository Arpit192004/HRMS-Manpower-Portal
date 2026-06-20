import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const eventLabels = {
  LOGIN_SUCCESS: "Login Success",
  LOGIN_FAILED: "Login Failed",
  ACCOUNT_LOCKED: "Account Locked",
  PASSWORD_RESET_REQUEST: "Reset Requested",
  PASSWORD_RESET_SUCCESS: "Reset Success",
  PASSWORD_CHANGED: "Password Changed",
  LOGOUT_ALL_SESSIONS: "Logout All Sessions"
};

const statusClass = {
  Success: "closed",
  Failed: "delayed",
  Warning: "at-risk"
};

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({ event: "", status: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    params.set("limit", "150");
    return params.toString();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(`/security-logs?${queryString}`);
      setLogs(data.logs || []);
      setSummary(data.summary || {});
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load security logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [queryString]);

  const setFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Security Logs</h1>
          <p>Monitor login attempts, password resets, account locks and session activity.</p>
        </div>
        <button className="secondary-button" onClick={loadLogs}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="security-log-summary">
        {Object.entries(eventLabels).map(([event, label]) => (
          <article className="content-card sla-kpi-card" key={event}>
            <span>{label}</span>
            <strong>{summary[event] || 0}</strong>
          </article>
        ))}
      </div>

      <div className="content-card module-toolbar">
        <label>
          Event
          <select value={filters.event} onChange={(event) => setFilter("event", event.target.value)}>
            <option value="">All Events</option>
            {Object.entries(eventLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
            <option value="">All Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Warning">Warning</option>
          </select>
        </label>

        <label>
          Email
          <input
            value={filters.email}
            onChange={(event) => setFilter("email", event.target.value)}
            placeholder="user@company.com"
          />
        </label>
      </div>

      <div className="content-card table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Event</th>
                <th>Status</th>
                <th>IP Address</th>
                <th>Browser</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>
                    <strong>{log.user?.name || log.email || "-"}</strong>
                    <span className="muted-block">{log.user?.role || log.role || "-"}</span>
                  </td>
                  <td>{eventLabels[log.event] || log.event}</td>
                  <td>
                    <span className={`status-pill ${statusClass[log.status] || ""}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{log.ipAddress || "-"}</td>
                  <td className="security-user-agent">{log.userAgent || "-"}</td>
                  <td>
                    {log.details && Object.keys(log.details).length
                      ? Object.entries(log.details)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(", ")
                      : "-"}
                  </td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan="7">{loading ? "Loading security logs..." : "No logs found"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default SecurityLogs;
