import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Receipt,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const Dashboard = () => {
  const [report, setReport] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/reports/dashboard");
        setReport(data.report || {});
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  const cards = [
    {
      title: "Departments",
      value: report.totalClients || 0,
      icon: Building2,
      color: "blue",
      helper: "Business units managed in Niyukti"
    },
    {
      title: "Active Employees",
      value: report.totalEmployees || 0,
      icon: Users,
      color: "green",
      helper: "Live employee records"
    },
    {
      title: "Candidates",
      value: report.totalCandidates || 0,
      icon: Briefcase,
      color: "purple",
      helper: "Applicants in hiring pipeline"
    },
    {
      title: "Pending Leaves",
      value: report.pendingLeaves || 0,
      icon: CalendarDays,
      color: "orange",
      helper: "Requests waiting for approval"
    }
  ];

  const queue = useMemo(
    () => [
      {
        title: "Hiring Pipeline",
        value: report.totalCandidates || 0,
        text: "Review candidate stages and move shortlisted candidates forward.",
        icon: BadgeCheck,
        to: "/admin/candidates"
      },
      {
        title: "Approval Desk",
        value: report.pendingLeaves || 0,
        text: "Clear pending leave, tour, expense and resignation requests.",
        icon: Clock3,
        to: "/admin/leaves"
      },
      {
        title: "Payroll & Documents",
        value: report.totalEmployees || 0,
        text: "Generate payslips, offer letters and appointment documents.",
        icon: FileText,
        to: "/admin/payroll"
      }
    ],
    [report]
  );

  return (
    <section>
      <div className="dashboard-hero content-card">
        <div>
          <span className="eyebrow">Super Admin Control Center</span>
          <h1>HR operations dashboard</h1>
          <p>
            Track hiring, workforce allocation, approvals, payroll and documents from one place.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <Link className="secondary-button" to="/admin/reports">View Reports</Link>
          <Link className="primary-button" to="/admin/jobs">Post Job</Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="content-card">Loading dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            {cards.map(({ title, value, icon: Icon, color, helper }) => (
              <article className="stat-card stat-card-pro" key={title}>
                <div className={`stat-icon ${color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p>{title}</p>
                  <h3>{value}</h3>
                  <small>{helper}</small>
                </div>
              </article>
            ))}
          </div>

          <div className="dashboard-grid">
            <div className="content-card">
              <div className="card-heading">
                <div>
                  <h3>Operational Queue</h3>
                  <p>Priority actions for today</p>
                </div>
              </div>

              <div className="queue-list">
                {queue.map(({ title, value, text, icon: Icon, to }) => (
                  <Link className="queue-item" to={to} key={title}>
                    <Icon size={21} />
                    <div>
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </div>
                    <b>{value}</b>
                  </Link>
                ))}
              </div>
            </div>

            <div className="content-card">
              <div className="card-heading">
                <div>
                  <h3>Production Readiness</h3>
                  <p>Core systems connected</p>
                </div>
              </div>

              <div className="readiness-list">
                <span><CheckCircle2 /> MongoDB Atlas database</span>
                <span><CheckCircle2 /> Brevo password reset emails</span>
                <span><CheckCircle2 /> Cloudinary document uploads</span>
                <span><CheckCircle2 /> Role-based portal login</span>
                <span><Receipt /> Payslip and HR PDFs</span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Dashboard;
