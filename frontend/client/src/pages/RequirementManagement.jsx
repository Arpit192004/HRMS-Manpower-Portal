import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const statuses = ["Requested", "Approved", "Converted", "Rejected", "Closed"];

const RequirementManagement = () => {
  const [requirements, setRequirements] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRequirements = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/requirements");
      setRequirements(data.requirements || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const summary = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status] = requirements.filter((requirement) => requirement.status === status).length;
      return acc;
    }, {});
  }, [requirements]);

  const convertToJob = async (id) => {
    setError("");
    setSuccess("");

    try {
      await api.post(`/requirements/${id}/convert`, {});
      setSuccess("Requirement converted to open job");
      await loadRequirements();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to convert requirement");
    }
  };

  const updateStatus = async (id, status) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/requirements/${id}`, { status });
      setSuccess("Requirement status updated");
      await loadRequirements();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update requirement");
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Client Requirements</h1>
          <p>Approve manpower requests and convert them into open jobs.</p>
        </div>
        <button className="secondary-button" onClick={loadRequirements}>Refresh</button>
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
          <p className="table-padding">Loading requirements...</p>
        ) : requirements.length === 0 ? (
          <div className="empty-state">
            <h3>No requirements found</h3>
            <p>Client manpower requests will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Title</th>
                  <th>Vacancies</th>
                  <th>Location</th>
                  <th>Required By</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement) => (
                  <tr key={requirement._id}>
                    <td>{requirement.client?.name || "-"}</td>
                    <td>{requirement.title}</td>
                    <td>{requirement.vacancies}</td>
                    <td>{requirement.location}</td>
                    <td>{new Date(requirement.requiredBy).toLocaleDateString()}</td>
                    <td>{requirement.priority}</td>
                    <td><span className={`status-pill ${requirement.status.toLowerCase()}`}>{requirement.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <select
                          value={requirement.status}
                          onChange={(event) => updateStatus(requirement._id, event.target.value)}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        {!requirement.job && requirement.status !== "Rejected" && (
                          <button className="mini-button" onClick={() => convertToJob(requirement._id)}>
                            Convert to Job
                          </button>
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

export default RequirementManagement;
