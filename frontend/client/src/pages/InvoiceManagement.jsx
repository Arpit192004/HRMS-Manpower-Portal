import { useEffect, useState } from "react";
import api from "../api/axios";
import downloadFile from "../utils/downloadFile";
import { useAuth } from "../context/AuthContext";

const InvoiceManagement = ({ clientView = false }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({
    client: user?.client || "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    defaultRate: 15000,
    taxRate: 18,
    notes: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/invoices");
      setInvoices(data.invoices || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const createInvoice = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/invoices", form);
      setSuccess("Invoice generated successfully");
      await loadInvoices();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate invoice");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (invoiceId, status) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status });
      setSuccess("Invoice status updated");
      await loadInvoices();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update invoice");
    }
  };

  return (
    <section>
      <div className={clientView ? "client-heading" : "page-heading"}>
        <div>
          <h1>Invoices</h1>
          <p>{clientView ? "View client billing and download invoices." : "Generate and manage client manpower billing."}</p>
        </div>
        <button className="secondary-button" onClick={loadInvoices}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {!clientView && (
        <form className="content-card form-grid" onSubmit={createInvoice}>
          <label>
            Client ID
            <input value={form.client} onChange={(event) => handleChange("client", event.target.value)} required />
          </label>
          <label>
            Month
            <input type="number" min="1" max="12" value={form.month} onChange={(event) => handleChange("month", event.target.value)} required />
          </label>
          <label>
            Year
            <input type="number" value={form.year} onChange={(event) => handleChange("year", event.target.value)} required />
          </label>
          <label>
            Default Rate Per Employee
            <input type="number" value={form.defaultRate} onChange={(event) => handleChange("defaultRate", event.target.value)} />
          </label>
          <label>
            GST %
            <input type="number" value={form.taxRate} onChange={(event) => handleChange("taxRate", event.target.value)} />
          </label>
          <label>
            Notes
            <input value={form.notes} onChange={(event) => handleChange("notes", event.target.value)} />
          </label>
          <button className="primary-button" disabled={saving}>
            {saving ? "Generating..." : "Generate Invoice"}
          </button>
        </form>
      )}

      <div className="content-card table-card">
        {loading ? (
          <p className="table-padding">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <h3>No invoices found</h3>
            <p>Generated invoices will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Period</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.client?.name || "-"}</td>
                    <td>{invoice.month}/{invoice.year}</td>
                    <td>Rs. {Number(invoice.totalAmount || 0).toFixed(2)}</td>
                    <td><span className={`status-pill ${invoice.status.toLowerCase()}`}>{invoice.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="mini-button"
                          onClick={() => downloadFile(`/invoices/${invoice._id}/pdf`, `${invoice.invoiceNumber}.pdf`)}
                        >
                          PDF
                        </button>
                        {!clientView && (
                          <select value={invoice.status} onChange={(event) => updateStatus(invoice._id, event.target.value)}>
                            {["Draft", "Sent", "Paid", "Cancelled"].map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default InvoiceManagement;
