import { Link } from "react-router-dom";
import {
  Briefcase,
  CalendarCheck,
  ShieldCheck,
  Users
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";

const services = [
  {
    title: "Hiring",
    text: "Jobs, applications, interviews and offers.",
    icon: Briefcase
  },
  {
    title: "Workforce",
    text: "Employees, attendance, leave and payroll.",
    icon: Users
  },
  {
    title: "Control",
    text: "Roles, approvals, documents and audit logs.",
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
          <Link to="/candidate/jobs">Open Jobs</Link>
          <Link to="/candidate/register">Candidate Signup</Link>
          <Link to="/login" className="nav-button">Company Login</Link>
        </div>
      </nav>

      <section className="public-hero">
        <div>
          <span className="eyebrow">Secure HR Management System</span>
          <h1>{settings.tagline || "Manage hiring, people and operations in one place."}</h1>
          <p>
            Niyukti is a role-based HR portal for administrators, HR teams,
            managers, employees and candidates.
          </p>

        </div>

        <div className="hero-panel">
          <div className="hero-panel-header">
            <span className="status-pill">Production Ready</span>
            <strong>Core Workspaces</strong>
          </div>

          <div className="hero-card-row">
            <Briefcase />
            <div>
              <strong>Candidate Portal</strong>
              <span>Register, verify email and apply for open jobs</span>
            </div>
          </div>

          <div className="hero-card-row">
            <Users />
            <div>
              <strong>Employee Portal</strong>
              <span>Attendance, leave, payroll and documents</span>
            </div>
          </div>

          <div className="hero-card-row">
            <CalendarCheck />
            <div>
              <strong>Admin & Manager Portal</strong>
              <span>Hiring, approvals, workforce data and reports</span>
            </div>
          </div>
        </div>
      </section>

      <section className="service-section">
        <div className="section-heading">
          <span className="eyebrow">Platform Scope</span>
          <h2>Everything HR needs to run daily operations</h2>
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
          <span className="eyebrow">Access</span>
          <h2>Sign in to your workspace</h2>
          <p>
            Internal users sign in with company-created accounts. Candidates can create a public account.
          </p>
        </div>

        <div className="access-card-grid">
          <article className="access-card">
            <strong>Company Login</strong>
            <span>Admin, HR, managers and employees sign in with their official company account.</span>
            <Link to="/login">Sign in to Niyukti</Link>
          </article>
          <article className="access-card">
            <strong>Candidate Access</strong>
            <span>Create your account, apply for jobs and track your hiring progress.</span>
            <Link to="/candidate/register">Register as Candidate</Link>
          </article>
        </div>
      </section>

      <footer className="public-footer">
        <span>{settings.companyName}</span>
        <div>
          <Link to="/about">About</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </main>
  );
};

export default PublicHome;
