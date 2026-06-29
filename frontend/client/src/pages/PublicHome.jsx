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
import { useCompany } from "../context/CompanyContext";

const services = [
  {
    title: "Recruitment Management",
    text: "Publish jobs, receive applications and move candidates through hiring stages.",
    icon: Briefcase
  },
  {
    title: "Employee Self Service",
    text: "Attendance, leaves, tours, expenses, payroll and resignation in one portal.",
    icon: Users
  },
  {
    title: "Manager Hiring Workspace",
    text: "Department managers can review shortlisted applicants and team workforce updates.",
    icon: Building2
  },
  {
    title: "HR Compliance",
    text: "Policies, approvals, audit logs and reports for day-to-day HR operations.",
    icon: ShieldCheck
  }
];

const PublicHome = () => {
  const { settings } = useCompany();

  return (
    <main className="public-site">
      <nav className="public-nav">
        <div className="public-brand">
          {settings.logoUrl ? (
            <img className="brand-image" src={settings.logoUrl} alt={settings.companyName} />
          ) : (
            <div className="brand-logo">HR</div>
          )}
          <span>{settings.companyName}</span>
        </div>

        <div className="public-nav-links">
          <Link to="/about">About</Link>
          <Link to="/services">Services</Link>
          <Link to="/industries">Industries</Link>
          <Link to="/candidate/jobs">Open Jobs</Link>
          <a href="#portal-access" className="nav-button">Portal Login</a>
        </div>
      </nav>

      <section className="public-hero">
        <div>
          <span className="eyebrow">Internal HRMS for modern companies</span>
          <h1>{settings.tagline || "From hiring to workforce management."}</h1>
          <p>
            Niyukti helps HR teams manage hiring, employees, attendance, payroll,
            documents, approvals and workforce reporting from one secure system.
          </p>

          <div className="hero-actions">
            <a href="#portal-access" className="primary-button">Portal Login</a>
            <Link to="/candidate/jobs" className="secondary-button">View Open Jobs</Link>
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
          <h2>Built for real internal HR operations</h2>
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

      <section className="access-section" id="portal-access">
        <div className="section-heading">
          <span className="eyebrow">Portal login</span>
          <h2>Choose your workspace</h2>
          <p>
            One clean access area for candidates, employees, managers and internal HR teams.
          </p>
        </div>

        <div className="access-card-grid">
          <article className="access-card">
            <strong>Candidate Access</strong>
            <span>Create your account, apply for jobs and track your hiring progress.</span>
            <Link to="/candidate/register">Register as Candidate</Link>
          </article>
          <article className="access-card">
            <strong>Manager Access</strong>
            <span>Hiring managers can review applicants and track department requests.</span>
            <Link to="/client/login">Manager Login</Link>
          </article>
          <article className="access-card">
            <strong>Employee Access</strong>
            <span>Employee accounts are created after joining and verification.</span>
            <Link to="/employee/login">Employee Login</Link>
          </article>
          <article className="access-card">
            <strong>Admin Access</strong>
            <span>Admin and HR access is restricted to authorized internal users.</span>
            <Link to="/login">Admin Login</Link>
          </article>
        </div>
      </section>

      <footer className="public-footer">
        <span>{settings.companyName}</span>
        <div>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </main>
  );
};

export default PublicHome;
