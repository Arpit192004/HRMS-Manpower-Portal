import { Link } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";

const pageContent = {
  about: {
    title: "About Us",
    eyebrow: "About our company",
    text: "We help organizations manage hiring, staffing, employee operations and manpower deployment through a connected digital workflow.",
    points: [
      "End-to-end recruitment and staffing operations",
      "Employee self-service and payroll workflows",
      "Client-facing manpower tracking",
      "Transparent approvals, logs and reports"
    ]
  },
  services: {
    title: "Services",
    eyebrow: "What we provide",
    text: "Our platform supports manpower businesses with operational modules for staffing, HR, compliance and employee lifecycle management.",
    points: [
      "Recruitment and candidate pipeline management",
      "Manpower deployment and client coordination",
      "Attendance, leave, tour and expense workflows",
      "Payroll, payslips, offer letters and document vault"
    ]
  },
  industries: {
    title: "Industries",
    eyebrow: "Where we operate",
    text: "The portal is built for manpower-heavy operations where speed, visibility and accountability matter.",
    points: [
      "Manufacturing and industrial staffing",
      "Warehousing and logistics",
      "Facility management",
      "Corporate and back-office staffing"
    ]
  },
  contact: {
    title: "Contact",
    eyebrow: "Talk to us",
    text: "Send us your manpower requirement from the homepage or contact our team directly.",
    points: []
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Data protection",
    text: "We collect only the information needed to manage HR, manpower, recruitment and service workflows. Access is role-based and protected.",
    points: [
      "Candidate and employee data is used for operational HR workflows",
      "Uploaded documents are stored securely via configured cloud storage",
      "Users can contact the administrator for data updates or access requests"
    ]
  },
  terms: {
    title: "Terms",
    eyebrow: "Usage terms",
    text: "This portal is intended for authorized candidates, employees, clients and HR administrators.",
    points: [
      "Users must keep their login credentials secure",
      "Uploaded documents must be accurate and lawful",
      "Administrators may audit activity for security and compliance"
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
            <Link className="primary-button" to="/#request-manpower">Submit Requirement</Link>
          </div>
        )}
      </section>
    </main>
  );
};

export default PublicInfoPage;
