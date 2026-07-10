import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isManagerRole } from "../utils/roles";

const ClientRoute = () => {
  const { user, authChecking } = useAuth();

  if (authChecking) {
    return <div className="route-loader">Verifying secure session...</div>;
  }

  if (!user) {
    return <Navigate to="/client/login" replace />;
  }

  if (!isManagerRole(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ClientRoute;
