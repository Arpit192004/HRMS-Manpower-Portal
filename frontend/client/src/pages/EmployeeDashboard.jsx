import { useEffect, useState } from "react";
import { Banknote, CalendarDays, ClipboardList, Receipt } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState({
    attendance: 0,
    leaves: 0,
    expenses: 0,
    payrolls: 0
  });
  const [balance, setBalance] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [employeesRes, attendanceRes, leavesRes, expensesRes, payrollRes, balanceRes] =
          await Promise.all([
            api.get("/employees"),
            api.get("/attendance"),
            api.get("/leaves"),
            api.get("/expenses"),
            api.get("/payroll"),
            api.get("/leaves/balance")
          ]);

        setProfile(employeesRes.data.employees?.[0] || null);
        setSummary({
          attendance: attendanceRes.data.attendance?.length || 0,
          leaves: leavesRes.data.leaveRequests?.length || 0,
          expenses: expensesRes.data.claims?.length || 0,
          payrolls: payrollRes.data.payrolls?.length || 0
        });
        setBalance(balanceRes.data.balance || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load employee dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    { title: "Attendance Records", value: summary.attendance, icon: CalendarDays, color: "blue" },
    { title: "Leave Requests", value: summary.leaves, icon: ClipboardList, color: "green" },
    { title: "Expense Claims", value: summary.expenses, icon: Receipt, color: "purple" },
    { title: "Payroll Slips", value: summary.payrolls, icon: Banknote, color: "orange" }
  ];

  return (
    <section>
      <div className="employee-heading">
        <div>
          <h1>Welcome, {user?.name}</h1>
          <p>Your employee self-service dashboard.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="content-card">Loading dashboard...</div>
      ) : (
        <>
          <div className="profile-card content-card">
            <div>
              <span className="status-pill">Employee Profile</span>
              <h2>{profile?.employeeCode || "Profile not created yet"}</h2>
              <p>
                {profile?.designation || "Designation pending"} •{" "}
                {profile?.department || "Department pending"} •{" "}
                {profile?.client?.name || "Client pending"}
              </p>
            </div>
            <div className="profile-meta">
              <span>Grade: {profile?.grade || "-"}</span>
              <span>Status: {profile?.status || "-"}</span>
              <span>Joining: {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : "-"}</span>
            </div>
          </div>

          <div className="stats-grid employee-stats">
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

          <div className="content-card">
            <h3>Leave Balance</h3>
            <div className="leave-balance-grid">
              {balance.map((item) => (
                <div key={item.leaveType}>
                  <strong>{item.leaveType}</strong>
                  <span>{item.remaining} remaining</span>
                  <small>{item.used} used of {item.total}</small>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default EmployeeDashboard;
