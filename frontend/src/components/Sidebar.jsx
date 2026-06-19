import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  LogOut,
  Plane,
  Receipt,
  Settings,
  UserRound,
  Users
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const links = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/clients", label: "Clients", icon: Building2 },
  { path: "/policies", label: "Policies", icon: Settings },
  { path: "/jobs", label: "Jobs", icon: Briefcase },
  { path: "/candidates", label: "Candidates", icon: UserRound },
  { path: "/interviews", label: "Interviews", icon: ClipboardCheck },
  { path: "/offers", label: "Offers", icon: FileText },
  { path: "/employees", label: "Employees", icon: Users },
  { path: "/attendance", label: "Attendance", icon: CalendarDays },
  { path: "/leaves", label: "Leaves", icon: CalendarDays },
  { path: "/tours", label: "Tours", icon: Plane },
  { path: "/expenses", label: "Expenses", icon: Receipt },
  { path: "/payroll", label: "Payroll", icon: CircleDollarSign },
  { path: "/resignations", label: "Resignations", icon: FileText },
  { path: "/reports", label: "Reports", icon: BarChart3 }
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">HR</div>
        <div>
          <strong>HRMS Portal</strong>
          <small>{user?.role}</small>
        </div>
      </div>

      <nav>
        {links.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
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
  );
};

export default Sidebar;