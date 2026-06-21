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

const demoAccounts = [
  { role: "Admin", email: "admin@hrms.com", password: "Admin@123", link: "/login" },
  { role: "Client", email: "client@hrms.com", password: "Client@123", link: "/client/login" },
  { role: "Employee", email: "employee@hrms.com", password: "Employee@123", link: "/employee/login" },
  { role: "Candidate", email: "candidate1@hrms.com", password: "Candidate@123", link: "/candidate/login" }
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
          <Link to="/candidate/register">Candidate Apply</Link>
          <Link to="/employee/login">Employee Login</Link>
          <Link to="/client/login">Client Login</Link>
          <Link to="/login" className="nav-button">Admin Login</Link>
        </div>
      </nav>

      <section className="public-hero">
        <div>
          <span className="eyebrow">Full-stack HRMS + Manpower Services</span>
          <h1>{settings.tagline || "Modern HRMS built for staffing, payroll and manpower operations."}</h1>
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

      <section className="demo-access-section">
        <div className="section-heading">
          <span className="eyebrow">Demo Access</span>
          <h2>Explore the live portal with realistic seeded data</h2>
          <p>Use these demo accounts to test every role without setting up anything.</p>
        </div>

        <div className="demo-account-grid">
          {demoAccounts.map((account) => (
            <article className="demo-account-card" key={account.role}>
              <strong>{account.role} Portal</strong>
              <span>{account.email}</span>
              <code>{account.password}</code>
              <Link to={account.link}>Open {account.role}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="lead-section" id="request-manpower">
        <div>
          <span className="eyebrow">Need manpower?</span>
          <h2>Send your requirement. Our team will contact you.</h2>
          <p>
            Share your staffing need and we will respond with candidates, hiring support and
            manpower deployment options.
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
            Requirement
            <textarea
              value={leadForm.requirement}
              onChange={(event) => handleLeadChange("requirement", event.target.value)}
              placeholder="Example: Need 20 warehouse staff in Delhi within 10 days"
              required
            />
          </label>
          <button className="primary-button" disabled={leadSaving}>
            {leadSaving ? "Submitting..." : "Submit Requirement"}
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
