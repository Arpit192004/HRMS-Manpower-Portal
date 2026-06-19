import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  CircleDollarSign,
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
  { path: "/admin", label: "Dashboard", icon: BarChart3 },
  { path: "/admin/clients", label: "Clients", icon: Building2 },
  { path: "/admin/policies", label: "Policies", icon: Settings },
  { path: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { path: "/admin/candidates", label: "Candidates", icon: UserRound },
  { path: "/admin/interviews", label: "Interviews", icon: FileText },
  { path: "/admin/offers", label: "Offers", icon: FileText },
  { path: "/admin/employees", label: "Employees", icon: Users },
  { path: "/admin/attendance", label: "Attendance", icon: CalendarDays },
  { path: "/admin/leaves", label: "Leaves", icon: CalendarDays },
  { path: "/admin/tours", label: "Tours", icon: Plane },
  { path: "/admin/expenses", label: "Expenses", icon: Receipt },
  { path: "/admin/payroll", label: "Payroll", icon: CircleDollarSign },
  { path: "/admin/resignations", label: "Resignations", icon: FileText },
  { path: "/admin/users", label: "Users & Roles", icon: Users },
  { path: "/admin/reports", label: "Reports", icon: BarChart3 }
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
            end={path === "/admin"}
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
