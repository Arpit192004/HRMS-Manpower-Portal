import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const statuses = ["New", "Contacted", "Qualified", "Converted", "Closed"];

const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    setLoading(true);
    setError("");

    try {
      const query = statusFilter === "All" ? "" : `?status=${statusFilter}`;
      const { data } = await api.get(`/leads${query}`);
      setLeads(data.leads || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  const summary = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status] = leads.filter((lead) => lead.status === status).length;
      return acc;
    }, {});
  }, [leads]);

  const updateStatus = async (leadId, status) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/leads/${leadId}`, { status });
      setSuccess("Lead status updated");
      await loadLeads();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update lead");
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Website Leads</h1>
          <p>Manage manpower enquiries submitted from the public website.</p>
        </div>
        <div className="page-actions">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button className="secondary-button" onClick={loadLeads}>Refresh</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="lead-summary">
        {statuses.map((status) => (
          <div className="content-card" key={status}>
            <strong>{summary[status] || 0}</strong>
            <span>{status}</span>
          </div>
        ))}
      </div>

      <div className="content-card table-card">
        {loading ? (
          <p className="table-padding">Loading leads...</p>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <h3>No leads found</h3>
            <p>New public enquiries will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Requirement</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id}>
                    <td>{lead.company}</td>
                    <td>{lead.name}</td>
                    <td>{lead.email}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.requirement}</td>
                    <td>
                      <span className={`status-pill ${lead.status.toLowerCase()}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={lead.status}
                        onChange={(event) => updateStatus(lead._id, event.target.value)}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
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

export default LeadManagement;
