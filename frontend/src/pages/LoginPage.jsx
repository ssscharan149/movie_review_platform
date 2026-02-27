import { useNavigate } from "react-router-dom";
import AuthPanel from "../components/AuthPanel";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onMessage }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSuccess = (data, mode) => {
    login(data);
    onMessage(`${mode === "register" ? "Registered" : "Logged in"} as ${data.name} (${data.role})`);
    navigate("/movies");
  };

  return (
    <div className="mx-auto max-w-lg">
      <AuthPanel onSuccess={handleSuccess} onError={onMessage} />
    </div>
  );
}
