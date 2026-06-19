import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ClientRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/client/login" replace />;
  }

  if (user.role !== "Client Approver") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ClientRoute;
