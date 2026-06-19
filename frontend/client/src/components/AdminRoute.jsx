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

  return <Outlet />;
};

export default AdminRoute;
