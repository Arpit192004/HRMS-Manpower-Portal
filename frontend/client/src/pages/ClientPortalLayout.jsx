import { NavLink, Outlet } from "react-router-dom";
import { Briefcase, Building2, CalendarDays, CircleDollarSign, FileText, LogOut, Sparkles, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { path: "/client/dashboard", label: "Manager Dashboard", icon: Building2 },
  { path: "/client/jobs", label: "Open Roles", icon: Briefcase },
  { path: "/client/requirements", label: "Hiring Requests", icon: Briefcase },
  { path: "/client/candidates", label: "Applicant Reviews", icon: FileText },
  { path: "/client/employees", label: "Team Members", icon: Users },
  { path: "/client/attendance-health", label: "Attendance Health", icon: CalendarDays },
  { path: "/client/invoices", label: "Invoices", icon: CircleDollarSign },
  { path: "/client/analytics", label: "Analytics", icon: Building2 },
  { path: "/client/copilot", label: "AI Copilot", icon: Sparkles },
  { path: "/client/sla", label: "SLA Dashboard", icon: Building2 },
  { path: "/client/compliance", label: "Compliance", icon: FileText }
];

const ClientPortalLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="client-portal">
      <aside className="client-sidebar">
        <div className="brand">
          <div className="brand-logo">MP</div>
          <div>
            <strong>Manager Portal</strong>
            <small>{user?.name}</small>
          </div>
        </div>

        <nav>
          {links.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="logout-button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="client-main">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientPortalLayout;
