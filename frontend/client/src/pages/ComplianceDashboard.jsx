import { useEffect, useState } from "react";
import api from "../api/axios";

const statuses = ["Pending", "Verified", "Rejected", "Expired"];

const ComplianceDashboard = ({ clientView = false }) => {
  const [report, setReport] = useState({ summary: {}, employees: [] });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCompliance = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/documents/compliance");
      setReport({
        summary: data.summary || {},
        employees: data.employees || []
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load compliance dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompliance();
  }, []);

  const updateVerification = async (employeeId, documentId, status) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/documents/employees/${employeeId}/${documentId}/verify`, {
        status,
        remarks: `Marked ${status} from compliance dashboard`
      });
      setSuccess("Document verification updated");
      await loadCompliance();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update document");
    }
  };

  const cards = [
    ["Compliance Score", `${report.summary.score || 0}%`],
    ["Verified", report.summary.verified || 0],
    ["Pending", report.summary.pending || 0],
    ["Rejected", report.summary.rejected || 0],
    ["Expired", report.summary.expired || 0]
  ];

  return (
    <section>
      <div className={clientView ? "client-heading" : "page-heading"}>
        <div>
          <h1>Compliance Verification</h1>
          <p>Track employee document verification, rejection and expiry status.</p>
        </div>
        <button className="secondary-button" onClick={loadCompliance}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="content-card">Loading compliance dashboard...</div>
      ) : (
        <>
          <div className="sla-card-grid">
            {cards.map(([title, value]) => (
              <div className="content-card sla-kpi-card" key={title}>
                <span>{title}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="compliance-grid">
            {report.employees.map((row) => (
              <article className="content-card compliance-card" key={row.employee.id}>
                <div className="compliance-card-header">
                  <div>
                    <h3>{row.employee.name || row.employee.employeeCode}</h3>
                    <p>{row.employee.employeeCode} - {row.employee.client?.name || "Client"}</p>
                  </div>
                  <span className={`status-pill ${row.score >= 80 ? "verified" : row.score >= 50 ? "at-risk" : "delayed"}`}>
                    {row.score}% verified
                  </span>
                </div>

                {row.documents.length === 0 ? (
                  <p className="muted-text">No documents uploaded yet.</p>
                ) : (
                  <div className="document-compliance-list">
                    {row.documents.map((document) => (
                      <div key={document._id} className="document-compliance-row">
                        <div>
                          <strong>{document.type}</strong>
                          <span>{document.title}</span>
                          {document.expiryDate && (
                            <small>Expires: {new Date(document.expiryDate).toLocaleDateString()}</small>
                          )}
                        </div>
                        <span className={`status-pill ${document.effectiveStatus.toLowerCase()}`}>
                          {document.effectiveStatus}
                        </span>
                        <a className="mini-link" href={document.url} target="_blank" rel="noreferrer">Open</a>
                        {!clientView && (
                          <select
                            value={document.verificationStatus}
                            onChange={(event) =>
                              updateVerification(row.employee.id, document._id, event.target.value)
                            }
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default ComplianceDashboard;
