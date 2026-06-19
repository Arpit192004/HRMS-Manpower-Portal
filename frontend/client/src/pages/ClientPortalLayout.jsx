import { NavLink, Outlet } from "react-router-dom";
import { Briefcase, Building2, FileText, LogOut, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { path: "/client/dashboard", label: "Dashboard", icon: Building2 },
  { path: "/client/jobs", label: "Jobs", icon: Briefcase },
  { path: "/client/candidates", label: "Candidates", icon: FileText },
  { path: "/client/employees", label: "Employees", icon: Users }
];

const ClientPortalLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="client-portal">
      <aside className="client-sidebar">
        <div className="brand">
          <div className="brand-logo">CL</div>
          <div>
            <strong>Client Portal</strong>
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
