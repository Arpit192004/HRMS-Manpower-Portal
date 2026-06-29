import { Link } from "react-router-dom";
import { useState } from "react";
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
import api from "../api/axios";
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
    text: "Department managers can raise hiring requests and review shortlisted applicants.",
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
  const [leadForm, setLeadForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    requirement: ""
  });
  const [leadMessage, setLeadMessage] = useState("");
  const [leadError, setLeadError] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);

  const handleLeadChange = (name, value) => {
    setLeadForm((current) => ({ ...current, [name]: value }));
  };

  const submitLead = async (event) => {
    event.preventDefault();
    setLeadSaving(true);
    setLeadError("");
    setLeadMessage("");

    try {
      const { data } = await api.post("/leads", leadForm);
      setLeadMessage(data.message || "Requirement submitted successfully.");
      setLeadForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        requirement: ""
      });
    } catch (requestError) {
      setLeadError(requestError.response?.data?.message || "Unable to submit requirement");
    } finally {
      setLeadSaving(false);
    }
  };

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
          <a href="#request-workforce">Hiring Request</a>
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
            <a href="#request-workforce" className="primary-button">Raise Hiring Request</a>
            <a href="#portal-access" className="secondary-button">Portal Login</a>
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

      <section className="lead-section" id="request-workforce">
        <div>
          <span className="eyebrow">Hiring request</span>
          <h2>Need to hire for a department?</h2>
          <p>
            Share the role, department, location and urgency. HR can convert approved
            requests into open jobs and track the hiring pipeline.
          </p>
          <div className="lead-contact-card">
            {settings.email && <span>Email: {settings.email}</span>}
            {settings.phone && <span>Phone: {settings.phone}</span>}
            {settings.address && <span>{settings.address}</span>}
          </div>
        </div>

        <form className="lead-form-card" onSubmit={submitLead}>
          {leadMessage && <div className="success-message">{leadMessage}</div>}
          {leadError && <div className="error-message">{leadError}</div>}

          <label>
            Your Name
            <input
              value={leadForm.name}
              onChange={(event) => handleLeadChange("name", event.target.value)}
              required
            />
          </label>
          <label>
            Company
            <input
              value={leadForm.company}
              onChange={(event) => handleLeadChange("company", event.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={leadForm.email}
              onChange={(event) => handleLeadChange("email", event.target.value)}
              required
            />
          </label>
          <label>
            Phone
            <input
              value={leadForm.phone}
              onChange={(event) => handleLeadChange("phone", event.target.value)}
              required
            />
          </label>
          <label className="wide-field">
            Hiring Requirement
            <textarea
              value={leadForm.requirement}
              onChange={(event) => handleLeadChange("requirement", event.target.value)}
              placeholder="Example: Need 2 HR executives for the Noida office within 30 days"
              required
            />
          </label>
          <button className="primary-button" disabled={leadSaving}>
            {leadSaving ? "Submitting..." : "Submit Hiring Request"}
          </button>
        </form>
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
