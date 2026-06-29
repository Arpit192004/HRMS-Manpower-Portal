import { useEffect, useMemo, useState } from "react";
import { Briefcase, CircleDollarSign, ClipboardList, FileText, Users } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const config = {
  jobs: { title: "Jobs", endpoint: "/jobs", key: "jobs" },
  candidates: { title: "Candidates", endpoint: "/candidates", key: "candidates" },
  employees: { title: "Employees", endpoint: "/employees", key: "employees" }
};

const getDisplayValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.length ? `${value.length} item(s)` : "-";
  if (typeof value === "object") {
    return value.name || value.title || value.employeeCode || value.code || value.email || "-";
  }
  if (String(value).includes("T") && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
};

const ClientDashboard = ({ module = "dashboard" }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    jobs: 0,
    candidates: 0,
    employees: 0,
    requirements: 0,
    invoices: 0
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const clientQuery = user?.client ? `?client=${user.client}` : "";

  const loadData = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (module === "dashboard") {
        const [jobsRes, candidatesRes, employeesRes, requirementsRes, invoicesRes] = await Promise.all([
          api.get(`/jobs${clientQuery}`),
          api.get(`/candidates${clientQuery}`),
          api.get(`/employees${clientQuery}`),
          api.get("/requirements"),
          api.get("/invoices")
        ]);

        setSummary({
          jobs: jobsRes.data.jobs?.length || 0,
          candidates: candidatesRes.data.candidates?.length || 0,
          employees: employeesRes.data.employees?.length || 0,
          requirements: requirementsRes.data.requirements?.length || 0,
          invoices: invoicesRes.data.invoices?.length || 0
        });
      } else {
        const selected = config[module];
        const joiner = clientQuery ? "&" : "?";
        const { data } = await api.get(`${selected.endpoint}${clientQuery}${joiner}limit=100`);
        setRecords(data[selected.key] || []);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load manager workspace data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRecords([]);
    loadData();
  }, [module, user?.client]);

  const columns = useMemo(() => {
    if (!records.length) return [];
    return Object.keys(records[0])
      .filter((key) => !["_id", "__v", "createdAt", "updatedAt"].includes(key))
      .slice(0, 7);
  }, [records]);

  const reviewCandidate = async (candidateId, decision) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/candidates/${candidateId}/client-review`, {
        decision,
        remarks: `Manager marked applicant as ${decision}`
      });
      setSuccess("Applicant review submitted");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit candidate review");
    }
  };

  if (module === "dashboard") {
    const cards = [
      { title: "Open Roles", value: summary.jobs, icon: Briefcase, color: "blue" },
      { title: "Hiring Requests", value: summary.requirements, icon: ClipboardList, color: "orange" },
      { title: "Applicant Pipeline", value: summary.candidates, icon: FileText, color: "purple" },
      { title: "Team Members", value: summary.employees, icon: Users, color: "green" },
      { title: "Invoices", value: summary.invoices, icon: CircleDollarSign, color: "blue" }
    ];

    return (
      <section>
        <div className="client-heading">
          <div>
            <h1>Manager Dashboard</h1>
            <p>Track department hiring, applicant reviews and team workforce updates.</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="content-card">Loading manager dashboard...</div>
        ) : (
          <div className="stats-grid">
            {cards.map(({ title, value, icon: Icon, color }) => (
              <article className="stat-card" key={title}>
                <div className={`stat-icon ${color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p>{title}</p>
                  <h3>{value}</h3>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  const selected = config[module];

  return (
    <section>
      <div className="client-heading">
        <div>
          <h1>{selected.title}</h1>
          <p>Department-linked {selected.title.toLowerCase()} records.</p>
        </div>
        <button className="secondary-button" onClick={loadData}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="content-card table-card">
        {loading ? (
          <p className="table-padding">Loading...</p>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <h3>No records found</h3>
            <p>Records linked to your manager workspace will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  {columns.map((column) => (
                    <th key={column}>{column.replace(/([A-Z])/g, " $1")}</th>
                  ))}
                  {module === "candidates" && <th>Review</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td><code>{record._id}</code></td>
                    {columns.map((column) => (
                      <td key={column}>{getDisplayValue(record[column])}</td>
                    ))}
                    {module === "candidates" && (
                      <td>
                        {record.status === "Submitted to Client" || record.status === "Submitted to Manager" ? (
                          <div className="row-actions">
                            <button
                              className="mini-button"
                              onClick={() => reviewCandidate(record._id, "Client Shortlisted")}
                            >
                              Shortlist
                            </button>
                            <button
                              className="mini-button danger"
                              onClick={() => reviewCandidate(record._id, "Client Rejected")}
                            >
                              Reject
                            </button>
                            <button
                              className="mini-button"
                              onClick={() => reviewCandidate(record._id, "More Profiles Requested")}
                            >
                              More Profiles
                            </button>
                          </div>
                        ) : (
                          <span className={`status-pill ${String(record.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                            {record.status || "-"}
                          </span>
                        )}
                      </td>
                    )}
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

export default ClientDashboard;
