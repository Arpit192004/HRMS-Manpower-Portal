import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import downloadFile from "../utils/downloadFile";

const configs = {
  attendance: {
    title: "Attendance",
    description: "Mark daily attendance and view your records.",
    endpoint: "/attendance",
    dataKey: "attendance",
    createLabel: "Mark Attendance",
    fields: [
      { name: "date", label: "Date", type: "date", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: ["Present", "Absent", "Half Day", "Leave", "Holiday", "Weekly Off"]
      },
      { name: "checkIn", label: "Check In", type: "datetime-local" },
      { name: "checkOut", label: "Check Out", type: "datetime-local" },
      { name: "remarks", label: "Remarks" }
    ],
    buildPayload: (form) => form,
    submit: (payload) => api.post("/attendance/mark", payload)
  },
  leaves: {
    title: "Leaves",
    description: "Apply leave and track approval status.",
    endpoint: "/leaves",
    dataKey: "leaveRequests",
    createLabel: "Apply Leave",
    fields: [
      {
        name: "leaveType",
        label: "Leave Type",
        type: "select",
        required: true,
        options: ["Casual", "Sick", "Earned", "Unpaid", "Other"]
      },
      { name: "fromDate", label: "From Date", type: "date", required: true },
      { name: "toDate", label: "To Date", type: "date", required: true },
      { name: "reason", label: "Reason", type: "textarea", required: true },
      { name: "approver", label: "Approver User ID", required: true }
    ],
    buildPayload: (form) => form,
    submit: (payload) => api.post("/leaves", payload),
    pendingAction: (id) => api.patch(`/leaves/${id}/cancel`)
  },
  tours: {
    title: "Tours",
    description: "Request business travel and advance approval.",
    endpoint: "/tours",
    dataKey: "tourRequests",
    createLabel: "Request Tour",
    fields: [
      { name: "purpose", label: "Purpose", required: true },
      { name: "fromLocation", label: "From Location", required: true },
      { name: "destination", label: "Destination", required: true },
      { name: "startDate", label: "Start Date", type: "date", required: true },
      { name: "endDate", label: "End Date", type: "date", required: true },
      {
        name: "travelMode",
        label: "Travel Mode",
        type: "select",
        required: true,
        options: ["Flight", "Train", "Bus", "Cab", "Own Vehicle", "Other"]
      },
      { name: "estimatedAmount", label: "Estimated Amount", type: "number", required: true },
      {
        name: "advanceRequired",
        label: "Advance Required",
        type: "select",
        options: ["No", "Yes"]
      },
      { name: "advanceAmount", label: "Advance Amount", type: "number" },
      { name: "approver", label: "Approver User ID", required: true }
    ],
    buildPayload: (form) => ({
      ...form,
      estimatedAmount: Number(form.estimatedAmount || 0),
      advanceRequired: form.advanceRequired === "Yes",
      advanceAmount: Number(form.advanceAmount || 0)
    }),
    submit: (payload) => api.post("/tours", payload),
    pendingAction: (id) => api.patch(`/tours/${id}/cancel`),
    approvedAction: (id) => api.patch(`/tours/${id}/complete`)
  },
  expenses: {
    title: "Expenses",
    description: "Submit expense claims and track processing.",
    endpoint: "/expenses",
    dataKey: "claims",
    createLabel: "Submit Claim",
    fields: [
      { name: "title", label: "Claim Title", required: true },
      { name: "tour", label: "Tour ID optional" },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: ["Travel", "Accommodation", "Food", "Fuel", "Medical", "Office", "Other"]
      },
      { name: "expenseDate", label: "Expense Date", type: "date", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "receiptUrl", label: "Receipt URL" },
      { name: "approver", label: "Approver User ID", required: true }
    ],
    buildPayload: (form) => ({
      title: form.title,
      tour: form.tour || null,
      approver: form.approver,
      items: [
        {
          category: form.category,
          expenseDate: form.expenseDate,
          description: form.description,
          amount: Number(form.amount || 0),
          receiptUrl: form.receiptUrl
        }
      ]
    }),
    submit: (payload) => api.post("/expenses", payload),
    pendingAction: (id) => api.patch(`/expenses/${id}/cancel`)
  },
  payroll: {
    title: "Payroll",
    description: "View generated salary slips and payment status.",
    endpoint: "/payroll",
    dataKey: "payrolls"
  },
  resignation: {
    title: "Resignation",
    description: "Submit or withdraw resignation requests.",
    endpoint: "/resignations",
    dataKey: "resignations",
    createLabel: "Submit Resignation",
    fields: [
      { name: "resignationDate", label: "Resignation Date", type: "date" },
      { name: "requestedLastWorkingDate", label: "Requested Last Working Date", type: "date" },
      { name: "reason", label: "Reason", type: "textarea", required: true },
      { name: "remarks", label: "Remarks" },
      { name: "approver", label: "Approver User ID", required: true }
    ],
    buildPayload: (form) => form,
    submit: (payload) => api.post("/resignations", payload),
    pendingAction: (id) => api.patch(`/resignations/${id}/withdraw`)
  }
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? `${value.length} item(s)` : "-";
  if (typeof value === "object") {
    return value.name || value.title || value.employeeCode || value.code || value.email || "-";
  }
  if (String(value).includes("T") && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
};

const EmployeeSelfService = ({ module }) => {
  const config = configs[module];
  const [records, setRecords] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    setError("");

    try {
      const [recordsRes, employeesRes] = await Promise.all([
        api.get(config.endpoint),
        api.get("/employees")
      ]);

      const employeeProfile = employeesRes.data.employees?.[0] || null;
      setProfile(employeeProfile);
      setRecords(recordsRes.data[config.dataKey] || []);

      const firstApprover = employeeProfile?.approvers?.[0]?._id;
      if (firstApprover) {
        setForm((current) => ({ approver: firstApprover, ...current }));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to load ${config.title}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRecords([]);
    setForm({});
    setShowForm(false);
    loadRecords();
  }, [module]);

  const columns = useMemo(() => {
    if (!records.length) return [];
    return Object.keys(records[0])
      .filter((key) => !["_id", "__v", "createdAt", "updatedAt"].includes(key))
      .slice(0, 7);
  }, [records]);

  const handleChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = config.buildPayload(form);
      await config.submit(payload);
      setSuccess(`${config.createLabel} completed successfully`);
      setForm(profile?.approvers?.[0]?._id ? { approver: profile.approvers[0]._id } : {});
      setShowForm(false);
      await loadRecords();
    } catch (requestError) {
      setError(requestError.response?.data?.message || `${config.createLabel} failed`);
    } finally {
      setSaving(false);
    }
  };

  const runRecordAction = async (label, action) => {
    setError("");
    setSuccess("");

    try {
      await action();
      setSuccess(`${label} completed successfully`);
      await loadRecords();
    } catch (requestError) {
      setError(requestError.response?.data?.message || `${label} failed`);
    }
  };

  if (!config) {
    return <div className="error-message">Unknown employee module</div>;
  }

  return (
    <section>
      <div className="employee-heading">
        <div>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={loadRecords}>Refresh</button>
          {config.fields && (
            <button className="primary-button" onClick={() => setShowForm((value) => !value)}>
              {showForm ? "Close" : `+ ${config.createLabel}`}
            </button>
          )}
        </div>
      </div>

      {profile?.approvers?.length > 0 && (
        <div className="content-card approver-strip">
          Default approver: <strong>{profile.approvers[0].name}</strong>{" "}
          <code>{profile.approvers[0]._id}</code>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && config.fields && (
        <form className="content-card employee-form-grid" onSubmit={submitForm}>
          {config.fields.map((field) => (
            <label key={field.name} className={field.type === "textarea" ? "wide-field" : ""}>
              {field.label}
              {field.type === "select" ? (
                <select
                  value={form[field.name] || ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  required={field.required}
                >
                  <option value="">Select</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={form[field.name] || ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  value={form[field.name] || ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  required={field.required}
                />
              )}
            </label>
          ))}
          <button className="primary-button" disabled={saving}>
            {saving ? "Saving..." : config.createLabel}
          </button>
        </form>
      )}

      <div className="content-card table-card">
        {loading ? (
          <p className="table-padding">Loading...</p>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <h3>No records found</h3>
            <p>Your records will appear here.</p>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td><code>{record._id}</code></td>
                    {columns.map((column) => (
                      <td key={column}>{formatValue(record[column])}</td>
                    ))}
                    <td>
                      <div className="row-actions">
                        {record.status === "Pending" && config.pendingAction && (
                          <button
                            className="mini-button danger"
                            onClick={() =>
                              runRecordAction("Request update", () => config.pendingAction(record._id))
                            }
                          >
                            {module === "resignation" ? "Withdraw" : "Cancel"}
                          </button>
                        )}
                        {record.status === "Approved" && config.approvedAction && (
                          <button
                            className="mini-button"
                            onClick={() =>
                              runRecordAction("Mark complete", () => config.approvedAction(record._id))
                            }
                          >
                            Complete
                          </button>
                        )}
                        {module === "payroll" && (
                          <button
                            className="mini-button"
                            onClick={() =>
                              downloadFile(
                                `/documents/payslip/${record._id}`,
                                `payslip-${record.month}-${record.year}.pdf`
                              )
                            }
                          >
                            Payslip
                          </button>
                        )}
                        {(!record.status || !config.pendingAction) && "-"}
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

export default EmployeeSelfService;
