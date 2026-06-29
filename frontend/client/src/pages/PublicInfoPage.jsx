import { Link } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";

const pageContent = {
  about: {
    title: "About Us",
    eyebrow: "About our company",
    text: "Niyukti is an internal HRMS for companies to manage hiring, employees, attendance, payroll, documents, approvals and workforce visibility.",
    points: [
      "End-to-end recruitment, offer, onboarding and employee lifecycle operations",
      "Employee self-service, attendance, payroll and document workflows",
      "Manager-facing hiring requests, applicant reviews and team visibility",
      "Transparent approvals, integrations, audit logs and executive reports"
    ]
  },
  services: {
    title: "Services",
    eyebrow: "What we provide",
    text: "Our platform supports internal HR teams with operational modules for recruitment, HR service delivery, compliance and employee lifecycle management.",
    points: [
      "Recruitment and candidate pipeline management",
      "Department hiring requests and manager approvals",
      "Attendance, leave, tour and expense workflows",
      "Payroll, payslips, invoices, e-sign letters and document vault",
      "Security logs, SLA dashboards and external integration monitoring"
    ]
  },
  industries: {
    title: "Industries",
    eyebrow: "Where we operate",
    text: "The portal is built for companies where hiring speed, employee operations, visibility and accountability matter.",
    points: [
      "IT services, BPO and back-office staffing",
      "Warehousing, logistics and fulfilment operations",
      "Retail, facility management and security services",
      "Healthcare, operations and administrative teams"
    ]
  },
  contact: {
    title: "Contact",
    eyebrow: "Talk to us",
    text: "Contact the HR team directly for portal access, hiring updates or employee support.",
    points: []
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Data protection",
    text: "We collect only the information required to operate recruitment, HR, payroll, employee service and manager approval workflows.",
    points: [
      "Candidate, employee and manager data is used only for authorized operational workflows",
      "Uploaded documents are stored through configured cloud storage and are visible based on role access",
      "Security logs are maintained for login, password reset and sensitive account activity",
      "Users can contact the administrator for data correction, access requests or account deactivation",
      "Production deployments should rotate credentials and restrict database/network access"
    ]
  },
  terms: {
    title: "Terms",
    eyebrow: "Usage terms",
    text: "This portal is intended for authorized candidates, employees, managers and HR administrators.",
    points: [
      "Users must keep their login credentials secure",
      "Uploaded documents must be accurate and lawful",
      "Administrators may audit activity for security, compliance and service quality",
      "Role-based access must not be bypassed or shared with unauthorized users",
      "Credentials, documents and payroll information must be handled through authorized accounts only"
    ]
  }
};

const PublicInfoPage = ({ page }) => {
  const { settings } = useCompany();
  const content = pageContent[page] || pageContent.about;

  return (
    <main className="public-site public-info-site">
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
          <Link to="/">Home</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login" className="nav-button">Login</Link>
        </div>
      </nav>

      <section className="public-info-card">
        <span className="eyebrow">{content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p>{content.text}</p>

        {content.points.length > 0 && (
          <div className="info-points">
            {content.points.map((point) => (
              <div key={point}>{point}</div>
            ))}
          </div>
        )}

        {page === "contact" && (
          <div className="lead-contact-card">
            {settings.email && <span>Email: {settings.email}</span>}
            {settings.phone && <span>Phone: {settings.phone}</span>}
            {settings.address && <span>{settings.address}</span>}
            <Link className="primary-button" to="/login">Portal Login</Link>
          </div>
        )}
      </section>
    </main>
  );
};

export default PublicInfoPage;
