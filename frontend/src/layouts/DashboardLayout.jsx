import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>Welcome, {user?.name}</h2>
            <p>Manage your HR operations</p>
          </div>

          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;