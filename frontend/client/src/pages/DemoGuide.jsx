import { Link } from "react-router-dom";

const demoAccounts = [
  {
    role: "Super Admin",
    login: "/login",
    email: "admin@hrms.com",
    password: "Admin@123",
    focus: "Full control, dashboards, users, integrations, approvals, security logs"
  },
  {
    role: "Client",
    login: "/client/login",
    email: "client@hrms.com",
    password: "Client@123",
    focus: "Requirements, candidates, invoices, SLA, manpower analytics"
  },
  {
    role: "Employee",
    login: "/employee/login",
    email: "employee@hrms.com",
    password: "Employee@123",
    focus: "Attendance, leaves, expenses, payroll, documents, e-sign"
  },
  {
    role: "Candidate",
    login: "/candidate/login",
    email: "candidate1@hrms.com",
    password: "Candidate@123",
    focus: "Open jobs, applications, candidate document flow"
  }
];

const demoFlow = [
  "Open Admin dashboard and show live KPIs.",
  "Visit Clients, Requirements and Pipeline Board.",
  "Open Approval Center and show SLA/escalation workflow.",
  "Show Executive Analytics and AI HR Copilot.",
  "Open Integration Hub to show payroll/accounting/ATS sync readiness.",
  "Login as Client and show manpower visibility.",
  "Login as Employee and show self-service workflows.",
  "Login as Candidate and apply/track applications.",
  "Finish with Security Logs to show auditability."
];

const featureChecklist = [
  "Role-based protected portals",
  "Live MongoDB Atlas production data",
  "Email password reset via Brevo",
  "Cloudinary document uploads",
  "PDF/document/e-sign workflow",
  "Shift roster and smart attendance",
  "Payroll and invoice visibility",
  "Audit logs and security controls",
  "Realistic seeded manpower data",
  "External system Integration Hub"
];

const DemoGuide = () => {
  return (
    <main className="demo-guide-page">
      <section className="demo-guide-hero">
        <div>
          <span className="eyebrow">Demo Playbook</span>
          <h1>Niyukti Demo Guide</h1>
          <p>
            Use this page during client presentations to show the complete real-world
            HR, staffing, payroll, client and employee workflow.
          </p>
        </div>
        <Link to="/" className="secondary-button">Back to Website</Link>
      </section>

      <section className="demo-guide-section">
        <div className="section-heading">
          <span className="eyebrow">Access</span>
          <h2>Role-wise login credentials</h2>
        </div>

        <div className="demo-guide-grid">
          {demoAccounts.map((account) => (
            <article className="demo-guide-card" key={account.role}>
              <h3>{account.role}</h3>
              <p>{account.focus}</p>
              <code>{account.email}</code>
              <code>{account.password}</code>
              <Link to={account.login}>Open {account.role}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-guide-section two-column-demo">
        <div className="content-card">
          <span className="eyebrow">Suggested Flow</span>
          <h2>10-minute demo sequence</h2>
          <ol className="demo-flow-list">
            {demoFlow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>

        <div className="content-card">
          <span className="eyebrow">Production Signals</span>
          <h2>What makes it feel real</h2>
          <div className="feature-check-grid">
            {featureChecklist.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="demo-guide-section">
        <div className="content-card demo-closing-card">
          <h2>Final client pitch</h2>
          <p>
            "Niyukti is an end-to-end HRMS and manpower operations platform where clients raise
            requirements, HR manages hiring, employees use self-service, payroll and invoices
            stay visible, and leadership gets analytics with audit-ready security."
          </p>
        </div>
      </section>
    </main>
  );
};

export default DemoGuide;
