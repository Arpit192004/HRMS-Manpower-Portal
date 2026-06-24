import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ClientRoute = () => {
  const { user, authChecking } = useAuth();

  if (authChecking) {
    return <div className="route-loader">Verifying secure session...</div>;
  }

  if (!user) {
    return <Navigate to="/client/login" replace />;
  }

  if (user.role !== "Client Approver") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ClientRoute;
