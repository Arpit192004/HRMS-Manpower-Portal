import { useEffect, useState } from "react";
import api from "../api/axios";

const defaultForm = {
  title: "",
  documentType: "Offer Letter",
  documentUrl: "",
  signer: "",
  candidate: "",
  employee: "",
  client: "",
  expiresInDays: 7
};

const ESignCenter = ({ signerView = false, headingClass = "page-heading" }) => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const request = api.get("/esign");

      if (signerView) {
        const { data } = await request;
        setRequests(data.requests || []);
      } else {
        const [requestsRes, usersRes, clientsRes, candidatesRes, employeesRes] = await Promise.all([
          request,
          api.get("/users"),
          api.get("/clients"),
          api.get("/candidates"),
          api.get("/employees")
        ]);
        setRequests(requestsRes.data.requests || []);
        setUsers(usersRes.data.users || []);
        setClients(clientsRes.data.clients || []);
        setCandidates(candidatesRes.data.candidates || []);
        setEmployees(employeesRes.data.employees || []);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load e-sign documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const createRequest = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/esign", {
        ...form,
        signer: form.signer || null,
        candidate: form.candidate || null,
        employee: form.employee || null,
        client: form.client || null,
        expiresInDays: Number(form.expiresInDays || 7)
      });
      setSuccess("E-sign request created and email sent");
      setForm(defaultForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create e-sign request");
    } finally {
      setSaving(false);
    }
  };

  const signRequest = async (id) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/esign/${id}/sign`, { signatureText: signature });
      setSuccess("Document signed successfully");
      setSignature("");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sign document");
    } finally {
      setSaving(false);
    }
  };

  const declineRequest = async (id) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/esign/${id}/decline`, { reason: "Declined by signer" });
      setSuccess("Document declined");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to decline document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className={headingClass}>
        <div>
          <h1>{signerView ? "Documents to Sign" : "E-Sign Center"}</h1>
          <p>
            {signerView
              ? "Review, accept and electronically sign HR documents."
              : "Send offer letters, appointment letters and agreements for electronic signature."}
          </p>
        </div>
        <button className="secondary-button" onClick={loadData}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {!signerView && (
        <form className="content-card employee-form-grid" onSubmit={createRequest}>
          <label>
            Title
            <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} required />
          </label>
          <label>
            Document Type
            <select value={form.documentType} onChange={(event) => updateForm("documentType", event.target.value)}>
              <option>Offer Letter</option>
              <option>Appointment Letter</option>
              <option>Policy</option>
              <option>Agreement</option>
              <option>Other</option>
            </select>
          </label>
          <label className="wide-field">
            Document URL
            <input value={form.documentUrl} onChange={(event) => updateForm("documentUrl", event.target.value)} required />
          </label>
          <label>
            Client
            <select value={form.client} onChange={(event) => updateForm("client", event.target.value)}>
              <option value="">None</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
          </label>
          <label>
            Direct Signer
            <select value={form.signer} onChange={(event) => updateForm("signer", event.target.value)}>
              <option value="">Select user</option>
              {users
                .filter((user) => ["Candidate", "Employee"].includes(user.role))
                .map((user) => (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
            </select>
          </label>
          <label>
            Candidate optional
            <select value={form.candidate} onChange={(event) => updateForm("candidate", event.target.value)}>
              <option value="">None</option>
              {candidates.map((candidate) => (
                <option key={candidate._id} value={candidate._id}>
                  {candidate.user?.name || candidate.phone} - {candidate.status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Employee optional
            <select value={form.employee} onChange={(event) => updateForm("employee", event.target.value)}>
              <option value="">None</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.employeeCode} - {employee.designation}
                </option>
              ))}
            </select>
          </label>
          <label>
            Expires in days
            <input type="number" min="1" value={form.expiresInDays} onChange={(event) => updateForm("expiresInDays", event.target.value)} />
          </label>
          <button className="primary-button" disabled={saving}>
            {saving ? "Sending..." : "Send for Signature"}
          </button>
        </form>
      )}

      <div className="esign-grid">
        {requests.map((request) => (
          <article className="content-card esign-card" key={request._id}>
            <div className="esign-card-head">
              <div>
                <span className={`status-pill ${request.status.toLowerCase()}`}>{request.status}</span>
                <h3>{request.title}</h3>
                <p>{request.documentType} • Signer: {request.signerName}</p>
              </div>
              <a href={request.documentUrl} target="_blank" rel="noreferrer" className="mini-link">
                Open Document
              </a>
            </div>

            <div className="approval-meta-grid">
              <div>
                <small>Expires</small>
                <strong>{new Date(request.expiresAt).toLocaleDateString()}</strong>
              </div>
              <div>
                <small>Signed At</small>
                <strong>{request.signedAt ? new Date(request.signedAt).toLocaleString() : "-"}</strong>
              </div>
              <div>
                <small>Signer IP</small>
                <strong>{request.signerIp || "-"}</strong>
              </div>
              <div>
                <small>Client</small>
                <strong>{request.client?.name || "-"}</strong>
              </div>
            </div>

            {signerView && request.status === "Pending" && (
              <div className="esign-sign-panel">
                <label>
                  Type your full name as signature
                  <input value={signature} onChange={(event) => setSignature(event.target.value)} placeholder={request.signerName} />
                </label>
                <div className="row-actions">
                  <button className="mini-button" disabled={saving || !signature} onClick={() => signRequest(request._id)}>
                    Accept & Sign
                  </button>
                  <button className="mini-button danger" disabled={saving} onClick={() => declineRequest(request._id)}>
                    Decline
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}

        {!requests.length && (
          <div className="empty-state content-card">
            <h3>{loading ? "Loading documents..." : "No e-sign documents"}</h3>
            <p>Signature requests will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ESignCenter;
