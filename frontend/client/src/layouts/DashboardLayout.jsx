import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api
      .get("/notifications")
      .then(({ data }) => setUnreadCount(data.unreadCount || 0))
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>Welcome, {user?.name}</h2>
            <p>Manage your HR operations</p>
          </div>

          <div className="topbar-actions">
            <Link className="notification-pill" to="/admin/notifications">
              Notifications
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </Link>

            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
