import { useEffect, useState } from "react";
import api from "../api/axios";

const statusClass = (value = "") => value.toLowerCase().replace(/\s+/g, "-");

const IntegrationHub = () => {
  const [summary, setSummary] = useState({});
  const [integrations, setIntegrations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState("");

  const loadIntegrations = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/integrations");
      setSummary(data.summary || {});
      setIntegrations(data.integrations || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const runSync = async (id) => {
    setSyncingId(id);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post(`/integrations/${id}/sync`);
      setSuccess(data.message || "Sync completed");
      await loadIntegrations();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to run sync");
    } finally {
      setSyncingId("");
    }
  };

  const cards = [
    ["Connected Systems", summary.connected || 0],
    ["Needs Attention", summary.attention || 0],
    ["Total Integrations", summary.total || 0],
    ["Records Synced", summary.recordsSynced || 0]
  ];

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Integration Hub</h1>
          <p>Connect HRMS with payroll, accounting, ATS, messaging and analytics systems.</p>
        </div>
        <button className="secondary-button" onClick={loadIntegrations}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="content-card">Loading integration health...</div>
      ) : (
        <>
          <div className="integration-summary-grid">
            {cards.map(([title, value]) => (
              <article className="content-card integration-kpi" key={title}>
                <span>{title}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>

          <div className="integration-grid">
            {integrations.map((item) => (
              <article className="content-card integration-card" key={item._id}>
                <div className="integration-card-head">
                  <div>
                    <span className="eyebrow">{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.provider} · {item.environment} · {item.syncDirection}</p>
                  </div>
                  <span className={`status-pill ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="integration-meta-grid">
                  <div>
                    <span>Sync Health</span>
                    <strong>{item.syncStatus}</strong>
                  </div>
                  <div>
                    <span>Records</span>
                    <strong>{item.recordsSynced}</strong>
                  </div>
                  <div>
                    <span>Error Rate</span>
                    <strong>{Number(item.errorRate || 0).toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span>Last Sync</span>
                    <strong>{item.lastSyncAt ? new Date(item.lastSyncAt).toLocaleString() : "-"}</strong>
                  </div>
                </div>

                <div className="integration-endpoints">
                  <p><strong>Base URL:</strong> {item.baseUrl || "-"}</p>
                  <p><strong>Webhook:</strong> {item.webhookUrl || "-"}</p>
                  <p><strong>Auth:</strong> {item.authType} · {item.maskedCredential}</p>
                </div>

                <div className="object-chip-row">
                  {(item.objects || []).map((object) => (
                    <span key={object}>{object}</span>
                  ))}
                </div>

                <div className="integration-log">
                  <h4>Latest Sync Log</h4>
                  {(item.syncLogs || []).slice(0, 2).map((log) => (
                    <p key={log._id || log.createdAt}>
                      <span className={`status-dot ${statusClass(log.status)}`} />
                      {log.message}
                    </p>
                  ))}
                </div>

                <button
                  className="primary-button"
                  onClick={() => runSync(item._id)}
                  disabled={syncingId === item._id}
                >
                  {syncingId === item._id ? "Syncing..." : "Run Test Sync"}
                </button>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default IntegrationHub;
