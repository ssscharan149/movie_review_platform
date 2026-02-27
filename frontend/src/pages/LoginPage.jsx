import { Navigate, useNavigate } from "react-router-dom";
import AuthPanel from "../components/AuthPanel";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onMessage }) {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to="/movies" replace />;
  }

  const handleSuccess = (data, mode) => {
    login(data);
    onMessage(`${mode === "register" ? "Registered" : "Logged in"} as ${data.name} (${data.role})`, "success");
    navigate("/movies");
  };

  const handleError = (message) => {
    onMessage(message, "error");
  };

  return (
    <div className="mx-auto max-w-lg">
      <AuthPanel onSuccess={handleSuccess} onError={handleError} />
    </div>
  );
}
