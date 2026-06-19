import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarCheck,
  FileText,
  MailCheck,
  ShieldCheck,
  Users
} from "lucide-react";

const services = [
  {
    title: "Recruitment & Staffing",
    text: "Publish jobs, receive applications and move candidates through hiring stages.",
    icon: Briefcase
  },
  {
    title: "Employee Self Service",
    text: "Attendance, leaves, tours, expenses, payroll and resignation in one portal.",
    icon: Users
  },
  {
    title: "Client Manpower Tracking",
    text: "Clients can review jobs, candidates and assigned manpower status.",
    icon: Building2
  },
  {
    title: "HR Compliance",
    text: "Policies, approvals, audit logs and reports for day-to-day HR operations.",
    icon: ShieldCheck
  }
];

const PublicHome = () => {
  return (
    <main className="public-site">
      <nav className="public-nav">
        <div className="public-brand">
          <div className="brand-logo">HR</div>
          <span>HRMS Manpower Portal</span>
        </div>

        <div className="public-nav-links">
          <Link to="/candidate/jobs">Open Jobs</Link>
          <Link to="/candidate/register">Candidate Apply</Link>
          <Link to="/employee/login">Employee Login</Link>
          <Link to="/client/login">Client Login</Link>
          <Link to="/login" className="nav-button">Admin Login</Link>
        </div>
      </nav>

      <section className="public-hero">
        <div>
          <span className="eyebrow">Full-stack HRMS + Manpower Services</span>
          <h1>Modern HRMS built for staffing, payroll and manpower operations.</h1>
          <p>
            A production-ready HRMS workflow for staffing companies: candidates apply,
            HR processes hiring, employees manage self-service, and clients track manpower.
          </p>

          <div className="hero-actions">
            <Link to="/candidate/register" className="primary-button">Apply as Candidate</Link>
            <Link to="/login" className="secondary-button">Open Admin Portal</Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-header">
            <span className="status-pill">Live Production Portal</span>
            <strong>End-to-end workflow</strong>
          </div>

          <div className="hero-card-row">
            <BadgeCheck />
            <div>
              <strong>Live Hiring Flow</strong>
              <span>Job to candidate to interview to offer to employee</span>
            </div>
          </div>

          <div className="hero-card-row">
            <CalendarCheck />
            <div>
              <strong>Employee Operations</strong>
              <span>Attendance, leaves, tours and claims</span>
            </div>
          </div>

          <div className="hero-card-row">
            <FileText />
            <div>
              <strong>Reports & Audit Logs</strong>
              <span>Management visibility for every module</span>
            </div>
          </div>

          <div className="hero-card-row">
            <MailCheck />
            <div>
              <strong>Email & Document Ready</strong>
              <span>Password reset, uploads and generated PDFs</span>
            </div>
          </div>
        </div>
      </section>

      <section className="public-metrics">
        <div>
          <strong>4</strong>
          <span>Role-based portals</span>
        </div>
        <div>
          <strong>18+</strong>
          <span>Business modules</span>
        </div>
        <div>
          <strong>Live</strong>
          <span>MongoDB, email and uploads</span>
        </div>
        <div>
          <strong>PDF</strong>
          <span>Payslip and letters</span>
        </div>
      </section>

      <section className="service-section">
        <div className="section-heading">
          <span className="eyebrow">What this portal handles</span>
          <h2>Built for real HR and manpower workflows</h2>
        </div>

        <div className="service-grid">
          {services.map(({ title, text, icon: Icon }) => (
            <article className="service-card" key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-cta-grid">
        <Link to="/candidate/login">
          <strong>Candidate Portal</strong>
          <span>View jobs, apply and track application status.</span>
        </Link>
        <Link to="/employee/login">
          <strong>Employee Portal</strong>
          <span>Attendance, leaves, expenses and salary slips.</span>
        </Link>
        <Link to="/client/login">
          <strong>Client Portal</strong>
          <span>Track jobs, candidates and assigned manpower.</span>
        </Link>
        <Link to="/login">
          <strong>Admin Control Center</strong>
          <span>Manage recruitment, payroll, approvals and reports.</span>
        </Link>
      </section>
    </main>
  );
};

export default PublicHome;
