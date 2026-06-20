import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const emptyShift = {
  client: "",
  name: "",
  code: "",
  startTime: "09:00",
  endTime: "18:00",
  graceMinutes: 10,
  weeklyOffs: "Sunday",
  isNightShift: "No"
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const ShiftRoster = ({ clientView = false }) => {
  const [shifts, setShifts] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [health, setHealth] = useState(null);
  const [form, setForm] = useState(emptyShift);
  const [assignForm, setAssignForm] = useState({ shift: "", employee: "" });
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const requests = [
        api.get("/shifts"),
        api.get(`/shifts/attendance-health?date=${date}`),
        api.get("/employees")
      ];

      if (!clientView) {
        requests.push(api.get("/clients"));
      }

      const [shiftRes, healthRes, employeeRes, clientRes] = await Promise.all(requests);

      setShifts(shiftRes.data.shifts || []);
      setHealth(healthRes.data || null);
      setEmployees(employeeRes.data.employees || []);
      setClients(clientRes?.data?.clients || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load shift roster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee._id,
        label: `${employee.employeeCode} - ${employee.designation || "Employee"}`
      })),
    [employees]
  );

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const createShift = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/shifts", {
        ...form,
        client: form.client || null,
        graceMinutes: Number(form.graceMinutes || 0),
        weeklyOffs: form.weeklyOffs
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        isNightShift: form.isNightShift === "Yes"
      });

      setMessage("Shift created successfully");
      setForm(emptyShift);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Shift creation failed");
    }
  };

  const assignShift = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!assignForm.shift || !assignForm.employee) {
      setError("Select shift and employee first");
      return;
    }

    try {
      await api.patch(`/shifts/${assignForm.shift}/assign/${assignForm.employee}`);
      setMessage("Shift assigned successfully");
      setAssignForm({ shift: "", employee: "" });
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Shift assignment failed");
    }
  };

  const summary = health?.summary || {};

  return (
    <section>
      <div className={clientView ? "client-heading" : "page-heading"}>
        <div>
          <h1>{clientView ? "Attendance Health" : "Shift Roster"}</h1>
          <p>
            {clientView
              ? "Track today attendance health, late arrivals and overtime."
              : "Create shifts, assign rosters and monitor smart attendance."}
          </p>
        </div>
        <div className="page-actions">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <button className="secondary-button" onClick={loadData}>Refresh</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="sla-card-grid">
        {[
          ["Active Employees", summary.activeEmployees || 0],
          ["Present", summary.present || 0],
          ["Absent / Not Marked", summary.absent || 0],
          ["Late Arrivals", summary.late || 0],
          ["Overtime", summary.overtime || 0],
          ["Not Marked", summary.notMarked || 0]
        ].map(([label, value]) => (
          <article className="content-card sla-kpi-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      {!clientView && (
        <div className="shift-admin-grid">
          <form className="content-card employee-form-grid" onSubmit={createShift}>
            <div className="table-section-heading inline-heading">
              <h3>Create Shift</h3>
              <p>General, client-specific and night shifts supported.</p>
            </div>

            <label>
              Client optional
              <select value={form.client} onChange={(event) => updateField("client", event.target.value)}>
                <option value="">Global shift</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} ({client.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Shift Name
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>
            <label>
              Code
              <input value={form.code} onChange={(event) => updateField("code", event.target.value)} required />
            </label>
            <label>
              Start Time
              <input type="time" value={form.startTime} onChange={(event) => updateField("startTime", event.target.value)} required />
            </label>
            <label>
              End Time
              <input type="time" value={form.endTime} onChange={(event) => updateField("endTime", event.target.value)} required />
            </label>
            <label>
              Grace Minutes
              <input type="number" min="0" value={form.graceMinutes} onChange={(event) => updateField("graceMinutes", event.target.value)} />
            </label>
            <label>
              Weekly Offs
              <input value={form.weeklyOffs} onChange={(event) => updateField("weeklyOffs", event.target.value)} placeholder="Sunday, Saturday" />
            </label>
            <label>
              Night Shift
              <select value={form.isNightShift} onChange={(event) => updateField("isNightShift", event.target.value)}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
            <button className="primary-button">Create Shift</button>
          </form>

          <form className="content-card employee-form-grid" onSubmit={assignShift}>
            <div className="table-section-heading inline-heading">
              <h3>Assign Shift</h3>
              <p>Employee roster updates instantly.</p>
            </div>
            <label>
              Shift
              <select value={assignForm.shift} onChange={(event) => setAssignForm((current) => ({ ...current, shift: event.target.value }))}>
                <option value="">Select shift</option>
                {shifts.map((shift) => (
                  <option key={shift._id} value={shift._id}>
                    {shift.name} ({shift.startTime}-{shift.endTime})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Employee
              <select value={assignForm.employee} onChange={(event) => setAssignForm((current) => ({ ...current, employee: event.target.value }))}>
                <option value="">Select employee</option>
                {employeeOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button">Assign Shift</button>
          </form>
        </div>
      )}

      {!clientView && (
        <div className="content-card table-card">
          <div className="table-section-heading">
            <h3>Active Shift Library</h3>
            <p>Use these shifts for payroll-linked attendance intelligence.</p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Shift</th>
                  <th>Client</th>
                  <th>Timing</th>
                  <th>Grace</th>
                  <th>Weekly Offs</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift._id}>
                    <td>
                      <strong>{shift.name}</strong>
                      <span className="muted-block">{shift.code}</span>
                    </td>
                    <td>{shift.client?.name || "Global"}</td>
                    <td>{shift.startTime} - {shift.endTime}</td>
                    <td>{shift.graceMinutes} min</td>
                    <td>{shift.weeklyOffs?.join(", ") || "-"}</td>
                    <td>
                      <span className={`status-pill ${shift.isActive ? "closed" : "delayed"}`}>
                        {shift.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!shifts.length && (
                  <tr>
                    <td colSpan="6">{loading ? "Loading..." : "No shifts created yet"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="content-card table-card">
        <div className="table-section-heading">
          <h3>Smart Attendance Health</h3>
          <p>Late, early leaving and overtime are calculated from assigned shifts.</p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Client</th>
                <th>Shift</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Late</th>
                <th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {(health?.attendance || []).map((row) => (
                <tr key={row._id}>
                  <td>
                    <strong>{row.employee?.employeeCode || "-"}</strong>
                    <span className="muted-block">{row.employee?.designation || "-"}</span>
                  </td>
                  <td>{row.client?.name || "-"}</td>
                  <td>{row.shift?.name || row.employee?.roster || "-"}</td>
                  <td>{formatDateTime(row.checkIn)}</td>
                  <td>{formatDateTime(row.checkOut)}</td>
                  <td>
                    <span className={`status-pill ${String(row.smartStatus || row.status).toLowerCase().replaceAll(" ", "-")}`}>
                      {row.smartStatus || row.status}
                    </span>
                  </td>
                  <td>{row.lateMinutes || 0} min</td>
                  <td>{row.overtimeMinutes || 0} min</td>
                </tr>
              ))}
              {!health?.attendance?.length && (
                <tr>
                  <td colSpan="8">{loading ? "Loading..." : "No attendance marked for this date"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ShiftRoster;
