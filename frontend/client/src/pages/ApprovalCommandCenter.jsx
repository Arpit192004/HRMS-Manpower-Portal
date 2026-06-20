import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const statusClass = {
  Pending: "at-risk",
  Approved: "closed",
  Rejected: "delayed",
  Cancelled: "expired"
};

const isOverdue = (workflow) =>
  workflow.status === "Pending" &&
  workflow.dueAt &&
  new Date(workflow.dueAt).getTime() < Date.now();

const ApprovalCommandCenter = () => {
  const [workflows, setWorkflows] = useState([]);
  const [summary, setSummary] = useState({});
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({ status: "", requestType: "", priority: "", overdue: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [workflowRes, summaryRes, clientRes] = await Promise.all([
        api.get(`/workflows?${query}`),
        api.get("/workflows/summary"),
        api.get("/clients")
      ]);

      setWorkflows(workflowRes.data.workflows || []);
      setSummary(summaryRes.data.summary || {});
      setClients(clientRes.data.clients || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [query]);

  const runAction = async (label, action) => {
    setMessage("");
    setError("");

    try {
      await action();
      setMessage(`${label} completed successfully`);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || `${label} failed`);
    }
  };

  const createDemoWorkflows = async () => {
    const client = clients[0]?._id;

    if (!client) {
      setError("Create a client first to generate demo approvals");
      return;
    }

    await runAction("Demo approvals", () => api.post("/workflows/demo", { client }));
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Approval Command Center</h1>
          <p>Track approval SLA, overdue requests and high-priority workflows in one place.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={createDemoWorkflows}>Generate Demo Queue</button>
          <button className="secondary-button" onClick={loadData}>Refresh</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="approval-kpi-grid">
        {[
          ["Pending", summary.pending || 0],
          ["My Pending", summary.myPending || 0],
          ["Overdue SLA", summary.overdue || 0],
          ["High Priority", summary.highPriority || 0],
          ["Approved", summary.approved || 0],
          ["Rejected", summary.rejected || 0]
        ].map(([label, value]) => (
          <article className="content-card sla-kpi-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="content-card module-toolbar">
        <label>
          Status
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Cancelled</option>
          </select>
        </label>
        <label>
          Type
          <select value={filters.requestType} onChange={(event) => setFilters((current) => ({ ...current, requestType: event.target.value }))}>
            <option value="">All</option>
            <option>Leave</option>
            <option>Tour</option>
            <option>Expense</option>
            <option>Offer</option>
            <option>Resignation</option>
          </select>
        </label>
        <label>
          Priority
          <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </label>
        <label>
          SLA
          <select value={filters.overdue} onChange={(event) => setFilters((current) => ({ ...current, overdue: event.target.value }))}>
            <option value="">All</option>
            <option value="true">Overdue only</option>
          </select>
        </label>
      </div>

      <div className="approval-board">
        {workflows.map((workflow) => (
          <article className={`content-card approval-card ${isOverdue(workflow) ? "overdue-card" : ""}`} key={workflow._id}>
            <div className="approval-card-header">
              <div>
                <span className={`status-pill ${statusClass[workflow.status] || ""}`}>{workflow.status}</span>
                <h3>{workflow.requestType} Approval</h3>
                <p>{workflow.client?.name || "Client"} • Requested by {workflow.requestedBy?.name || "-"}</p>
              </div>
              <span className={`priority-badge ${workflow.priority?.toLowerCase()}`}>{workflow.priority}</span>
            </div>

            <div className="approval-meta-grid">
              <div>
                <small>Current Step</small>
                <strong>{workflow.currentStep} / {workflow.steps?.length || 0}</strong>
              </div>
              <div>
                <small>Due At</small>
                <strong>{workflow.dueAt ? new Date(workflow.dueAt).toLocaleString() : "-"}</strong>
              </div>
              <div>
                <small>SLA</small>
                <strong>{isOverdue(workflow) ? "Overdue" : `${workflow.slaHours || 24} hrs`}</strong>
              </div>
              <div>
                <small>Escalation</small>
                <strong>Level {workflow.escalationLevel || 0}</strong>
              </div>
            </div>

            <div className="approval-steps">
              {workflow.steps?.map((step) => (
                <span className={step.status.toLowerCase()} key={step._id}>
                  {step.sequence}. {step.approver?.name || "Approver"} - {step.status}
                </span>
              ))}
            </div>

            {workflow.status === "Pending" && (
              <div className="row-actions">
                <button
                  className="mini-button"
                  onClick={() =>
                    runAction("Approve", () =>
                      api.patch(`/workflows/${workflow._id}/process`, { decision: "Approved", remarks: "Approved from command center" })
                    )
                  }
                >
                  Approve
                </button>
                <button
                  className="mini-button danger"
                  onClick={() =>
                    runAction("Reject", () =>
                      api.patch(`/workflows/${workflow._id}/process`, { decision: "Rejected", remarks: "Rejected from command center" })
                    )
                  }
                >
                  Reject
                </button>
                <button
                  className="mini-button"
                  onClick={() => runAction("Escalate", () => api.patch(`/workflows/${workflow._id}/escalate`))}
                >
                  Escalate
                </button>
              </div>
            )}
          </article>
        ))}

        {!workflows.length && (
          <div className="empty-state content-card">
            <h3>{loading ? "Loading approvals..." : "No workflows found"}</h3>
            <p>Generate a demo queue or create workflows from approval modules.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ApprovalCommandCenter;
