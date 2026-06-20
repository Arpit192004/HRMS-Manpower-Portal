import { useEffect, useState } from "react";
import api from "../api/axios";

const SlaDashboard = ({ clientView = false }) => {
  const [report, setReport] = useState({
    summary: {},
    requirements: [],
    invoices: []
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/reports/sla");
      setReport({
        summary: data.summary || {},
        requirements: data.requirements || [],
        invoices: data.invoices || []
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load SLA dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const cards = [
    ["Total Requirements", report.summary.totalRequirements || 0],
    ["At Risk", report.summary.atRisk || 0],
    ["Delayed", report.summary.delayed || 0],
    ["Joined", report.summary.joined || 0],
    ["Outstanding", `Rs. ${Number(report.summary.outstandingAmount || 0).toFixed(2)}`],
    ["Overdue", `Rs. ${Number(report.summary.overdueAmount || 0).toFixed(2)}`]
  ];

  return (
    <section>
      <div className={clientView ? "client-heading" : "page-heading"}>
        <div>
          <h1>Client SLA Dashboard</h1>
          <p>Track requirement delivery, hiring funnel and invoice risk.</p>
        </div>
        <button className="secondary-button" onClick={loadReport}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="content-card">Loading SLA dashboard...</div>
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

          <div className="content-card table-card">
            <div className="table-section-heading">
              <h3>Requirement SLA</h3>
              <p>Delivery status by requirement.</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Requirement</th>
                    <th>Vacancies</th>
                    <th>Submitted</th>
                    <th>Shortlisted</th>
                    <th>Joined</th>
                    <th>Days Left</th>
                    <th>SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {report.requirements.map((row) => (
                    <tr key={row.id}>
                      <td>{row.client?.name || "-"}</td>
                      <td>{row.title}</td>
                      <td>{row.vacancies}</td>
                      <td>{row.submitted}</td>
                      <td>{row.shortlisted}</td>
                      <td>{row.joined}</td>
                      <td>{row.daysLeft}</td>
                      <td>
                        <span className={`status-pill ${row.slaStatus.toLowerCase().replace(/\s+/g, "-")}`}>
                          {row.slaStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="content-card table-card">
            <div className="table-section-heading">
              <h3>Invoice Outstanding</h3>
              <p>Unpaid and overdue billing visibility.</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Period</th>
                    <th>Total</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {report.invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.client?.name || "-"}</td>
                      <td>{invoice.period}</td>
                      <td>Rs. {Number(invoice.totalAmount || 0).toFixed(2)}</td>
                      <td>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}</td>
                      <td><span className={`status-pill ${invoice.status.toLowerCase()}`}>{invoice.status}</span></td>
                      <td>
                        <span className={`status-pill ${invoice.isOverdue ? "delayed" : invoice.isOutstanding ? "at-risk" : "closed"}`}>
                          {invoice.isOverdue ? "Overdue" : invoice.isOutstanding ? "Outstanding" : "Clear"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default SlaDashboard;
