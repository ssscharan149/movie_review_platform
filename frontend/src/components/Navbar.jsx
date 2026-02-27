import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItemClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-semibold transition ${
    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"
  }`;

export default function Navbar({ onMessage }) {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onMessage("Logged out");
    navigate("/login");
  };

  return (
    <header className="mb-6 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/movies" className="text-lg font-black tracking-tight text-slate-900">
          Movie Review Platform
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/movies" className={navItemClass}>
            Movies
          </NavLink>
          {user?.role === "ADMIN" && (
            <NavLink to="/admin" className={navItemClass}>
              Admin
            </NavLink>
          )}
          <NavLink to="/profile" className={navItemClass}>
            Profile
          </NavLink>
          {!isLoggedIn ? (
            <NavLink to="/login" className={navItemClass}>
              Login
            </NavLink>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
      {isLoggedIn && (
        <p className="mt-2 text-xs text-slate-600">
          Signed in as <span className="font-semibold">{user.name}</span> ({user.role})
        </p>
      )}
    </header>
  );
}
