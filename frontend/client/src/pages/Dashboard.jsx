import { useEffect, useState } from "react";
import { Briefcase, Building2, CalendarDays, Users } from "lucide-react";
import api from "../api/axios";

const Dashboard = () => {
  const [report, setReport] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reports/dashboard")
      .then(({ data }) => setReport(data.report))
      .catch((err) =>
        setError(err.response?.data?.message || "Unable to load dashboard")
      );
  }, []);

  const cards = [
    {
      title: "Active Clients",
      value: report.totalClients || 0,
      icon: Building2,
      color: "blue"
    },
    {
      title: "Active Employees",
      value: report.totalEmployees || 0,
      icon: Users,
      color: "green"
    },
    {
      title: "Candidates",
      value: report.totalCandidates || 0,
      icon: Briefcase,
      color: "purple"
    },
    {
      title: "Pending Leaves",
      value: report.pendingLeaves || 0,
      icon: CalendarDays,
      color: "orange"
    }
  ];

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your HR operations</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

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
    </section>
  );
};

export default Dashboard;