import { NavLink, Outlet } from "react-router-dom";
import {
  Banknote,
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  LogOut,
  Plane,
  Receipt
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { path: "/employee/dashboard", label: "Dashboard", icon: Gauge },
  { path: "/employee/attendance", label: "Attendance", icon: CalendarDays },
  { path: "/employee/leaves", label: "Leaves", icon: ClipboardList },
  { path: "/employee/tours", label: "Tours", icon: Plane },
  { path: "/employee/expenses", label: "Expenses", icon: Receipt },
  { path: "/employee/payroll", label: "Payroll", icon: Banknote },
  { path: "/employee/resignation", label: "Resignation", icon: FileText }
];

const EmployeePortalLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="employee-portal">
      <aside className="employee-sidebar">
        <div className="brand">
          <div className="brand-logo">EP</div>
          <div>
            <strong>Employee Portal</strong>
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

      <main className="employee-main">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeePortalLayout;
