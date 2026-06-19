import { NavLink, Outlet } from "react-router-dom";
import { Briefcase, FileText, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const CandidatePortalLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="candidate-portal">
      <aside className="candidate-sidebar">
        <div className="brand">
          <div className="brand-logo">CP</div>
          <div>
            <strong>Candidate Portal</strong>
            <small>{user?.name}</small>
          </div>
        </div>

        <nav>
          <NavLink to="/candidate/jobs">
            <Briefcase size={18} />
            Open Jobs
          </NavLink>
          <NavLink to="/candidate/applications">
            <FileText size={18} />
            My Applications
          </NavLink>
        </nav>

        <button className="logout-button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="candidate-main">
        <Outlet />
      </main>
    </div>
  );
};

export default CandidatePortalLayout;
