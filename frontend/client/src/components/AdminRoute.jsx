import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UnauthorizedAccess from "../pages/UnauthorizedAccess";

const AdminRoute = () => {
  const { user, authChecking } = useAuth();

  if (authChecking) {
    return <div className="route-loader">Verifying secure session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (["Candidate", "Employee", "Client Approver"].includes(user.role)) {
    return <UnauthorizedAccess area="the admin portal" loginPath="/login" />;
  }

  return <Outlet />;
};

export default AdminRoute;
