import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "Candidate") {
    return <Navigate to="/candidate/jobs" replace />;
  }

  if (user.role === "Employee") {
    return <Navigate to="/employee/dashboard" replace />;
  }

  if (user.role === "Client Approver") {
    return <Navigate to="/client/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
