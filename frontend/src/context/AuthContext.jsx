import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

function readInitialUser() {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  if (!token || !refreshToken || !name || !role || !userId) {
    return null;
  }
  return { token, refreshToken, name, role, userId: Number(userId) };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitialUser);

  const login = (authResponse) => {
    const nextUser = {
      token: authResponse.token,
      refreshToken: authResponse.refreshToken,
      name: authResponse.name,
      role: authResponse.role,
      userId: Number(authResponse.userId),
    };
    localStorage.setItem("token", nextUser.token);
    localStorage.setItem("refreshToken", nextUser.refreshToken);
    localStorage.setItem("name", nextUser.name);
    localStorage.setItem("role", nextUser.role);
    localStorage.setItem("userId", String(nextUser.userId));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user?.token),
      login,
      logout,
    }),
    [user]
  );

  useEffect(() => {
    const handleForcedLogout = () => setUser(null);
    window.addEventListener("auth:forced-logout", handleForcedLogout);
    return () => window.removeEventListener("auth:forced-logout", handleForcedLogout);
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
