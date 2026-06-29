import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authChecking, setAuthChecking] = useState(Boolean(localStorage.getItem("token")));

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        clearSession();
        setAuthChecking(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } catch {
        clearSession();
      } finally {
        setAuthChecking(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setUser(data.user);
    return data.user;
  };

  const registerCandidate = async ({ name, email, password }) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password
    });

    return data;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, authChecking, login, registerCandidate, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
