import { useEffect, useState } from "react";
import api from "../api/axios";

const initialForm = {
  title: "",
  department: "",
  location: "",
  vacancies: 1,
  requiredBy: "",
  budgetMin: "",
  budgetMax: "",
  experienceMin: "",
  experienceMax: "",
  skills: "",
  priority: "Medium",
  description: ""
};

const ClientRequirements = () => {
  const [requirements, setRequirements] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRequirements = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/requirements");
      setRequirements(data.requirements || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load hiring requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const handleChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitRequirement = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/requirements", form);
      setSuccess("Hiring request submitted successfully");
      setForm(initialForm);
      await loadRequirements();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit hiring request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="client-heading">
        <div>
          <h1>Hiring Requests</h1>
          <p>Raise department hiring needs and track conversion to open roles.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form className="content-card employee-form-grid" onSubmit={submitRequirement}>
        <label>
          Job Title
          <input value={form.title} onChange={(event) => handleChange("title", event.target.value)} required />
        </label>
        <label>
          Department
          <input value={form.department} onChange={(event) => handleChange("department", event.target.value)} required />
        </label>
        <label>
          Location
          <input value={form.location} onChange={(event) => handleChange("location", event.target.value)} required />
        </label>
        <label>
          Vacancies
          <input type="number" min="1" value={form.vacancies} onChange={(event) => handleChange("vacancies", event.target.value)} required />
        </label>
        <label>
          Required By
          <input type="date" value={form.requiredBy} onChange={(event) => handleChange("requiredBy", event.target.value)} required />
        </label>
        <label>
          Priority
          <select value={form.priority} onChange={(event) => handleChange("priority", event.target.value)}>
            {["Low", "Medium", "High", "Urgent"].map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </label>
        <label>
          Budget Min
          <input type="number" value={form.budgetMin} onChange={(event) => handleChange("budgetMin", event.target.value)} />
        </label>
        <label>
          Budget Max
          <input type="number" value={form.budgetMax} onChange={(event) => handleChange("budgetMax", event.target.value)} />
        </label>
        <label>
          Skills
          <input value={form.skills} onChange={(event) => handleChange("skills", event.target.value)} placeholder="Excel, Machine Operator" />
        </label>
        <label className="wide-field">
          Hiring Request Details
          <textarea value={form.description} onChange={(event) => handleChange("description", event.target.value)} required />
        </label>
        <button className="primary-button" disabled={saving}>
          {saving ? "Submitting..." : "Submit Hiring Request"}
        </button>
      </form>

      <div className="content-card table-card">
        {loading ? (
          <p className="table-padding">Loading hiring requests...</p>
        ) : requirements.length === 0 ? (
          <div className="empty-state">
            <h3>No hiring requests submitted</h3>
            <p>Your submitted department hiring requests will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Vacancies</th>
                  <th>Location</th>
                  <th>Required By</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Job</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement) => (
                  <tr key={requirement._id}>
                    <td>{requirement.title}</td>
                    <td>{requirement.vacancies}</td>
                    <td>{requirement.location}</td>
                    <td>{new Date(requirement.requiredBy).toLocaleDateString()}</td>
                    <td>{requirement.priority}</td>
                    <td><span className={`status-pill ${requirement.status.toLowerCase()}`}>{requirement.status}</span></td>
                    <td>{requirement.job?.title || "-"}</td>
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

export default ClientRequirements;
