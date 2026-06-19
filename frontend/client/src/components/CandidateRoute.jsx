import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CandidateRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/candidate/login" replace />;
  }

  if (user.role !== "Candidate") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default CandidateRoute;
