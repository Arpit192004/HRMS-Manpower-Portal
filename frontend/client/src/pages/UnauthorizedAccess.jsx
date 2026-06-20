import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const UnauthorizedAccess = ({ area = "this area", loginPath = "/login" }) => {
  const { user, logout } = useAuth();

  const switchAccount = () => {
    logout();
    window.location.href = loginPath;
  };

  return (
    <div className="login-page">
      <div className="login-card unauthorized-card">
        <div className="logo">
          <ShieldAlert size={22} />
        </div>
        <h1>Access Restricted</h1>
        <p>
          You are signed in as <strong>{user?.role || "another user"}</strong>.
          This account cannot open {area}.
        </p>

        <button type="button" onClick={switchAccount}>
          Switch to Admin Account
        </button>

        <p className="login-switch">
          <Link to="/">Go to website home</Link>
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;
