import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EmployeeRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "Employee") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default EmployeeRoute;
