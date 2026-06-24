import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CandidateRoute = () => {
  const { user, authChecking } = useAuth();

  if (authChecking) {
    return <div className="route-loader">Verifying secure session...</div>;
  }

  if (!user) {
    return <Navigate to="/candidate/login" replace />;
  }

  if (user.role !== "Candidate") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default CandidateRoute;
