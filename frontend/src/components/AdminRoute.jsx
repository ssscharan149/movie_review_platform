import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== "ADMIN") {
    return <Navigate to="/movies" replace />;
  }
  return children;
}
