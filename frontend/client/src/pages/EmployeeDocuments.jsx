import { useEffect, useState } from "react";
import api from "../api/axios";
import downloadFile from "../utils/downloadFile";
import FileUploadField from "../components/FileUploadField";

const documentTypes = [
  "Resume",
  "Offer Letter",
  "Appointment Letter",
  "Salary Slip",
  "Aadhaar",
  "PAN",
  "Qualification",
  "Experience Letter",
  "Other"
];

const EmployeeDocuments = () => {
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({
    type: "Other",
    title: "",
    url: "",
    expiryDate: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    setError("");

    try {
      const employeesRes = await api.get("/employees");
      const currentEmployee = employeesRes.data.employees?.[0] || null;
      setEmployee(currentEmployee);

      if (currentEmployee?._id) {
        const docsRes = await api.get(`/documents/employees/${currentEmployee._id}`);
        setDocuments(docsRes.data.documents || []);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const submitDocument = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/documents/employees/${employee._id}`, form);
      setSuccess("Document link added successfully");
      setForm({ type: "Other", title: "", url: "", expiryDate: "" });
      await loadDocuments();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="employee-heading">
        <div>
          <h1>Document Vault</h1>
          <p>Download system letters and save your document links.</p>
        </div>
        <button className="secondary-button" onClick={loadDocuments}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {employee?._id && (
        <div className="content-card document-actions-card">
          <button
            className="primary-button"
            onClick={() =>
              downloadFile(
                `/documents/appointment/${employee._id}`,
                `appointment-letter-${employee.employeeCode}.pdf`
              )
            }
          >
            Download Appointment Letter
          </button>
        </div>
      )}

      {employee?._id && (
        <form className="content-card employee-form-grid" onSubmit={submitDocument}>
          <label>
            Document Type
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              required
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <label className="wide-field">
            Document URL
            <input
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://drive.google.com/document.pdf"
              required
            />
          </label>

          <label>
            Expiry Date optional
            <input
              type="date"
              value={form.expiryDate}
              onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))}
            />
          </label>

          <div className="wide-field">
            <FileUploadField
              label="Upload Document"
              folder="employee-documents"
              onUploaded={(url) => setForm((current) => ({ ...current, url }))}
            />
          </div>

          <button className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Add Document Link"}
          </button>
        </form>
      )}

      <div className="content-card table-card">
        {loading ? (
          <p className="table-padding">Loading...</p>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <h3>No documents added</h3>
            <p>Document links and generated letters will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Uploaded At</th>
                  <th>Verification</th>
                  <th>Expiry</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document._id}>
                    <td>{document.type}</td>
                    <td>{document.title}</td>
                    <td>{new Date(document.uploadedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-pill ${(document.verificationStatus || "Pending").toLowerCase()}`}>
                        {document.verificationStatus || "Pending"}
                      </span>
                    </td>
                    <td>{document.expiryDate ? new Date(document.expiryDate).toLocaleDateString() : "-"}</td>
                    <td>
                      <a href={document.url} target="_blank" rel="noreferrer" className="mini-link">
                        Open
                      </a>
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

export default EmployeeDocuments;
