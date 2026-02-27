import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

function readInitialUser() {
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  if (!token || !name || !role || !userId) {
    return null;
  }
  return { token, name, role, userId: Number(userId) };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitialUser);

  const login = (authResponse) => {
    const nextUser = {
      token: authResponse.token,
      name: authResponse.name,
      role: authResponse.role,
      userId: Number(authResponse.userId),
    };
    localStorage.setItem("token", nextUser.token);
    localStorage.setItem("name", nextUser.name);
    localStorage.setItem("role", nextUser.role);
    localStorage.setItem("userId", String(nextUser.userId));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
