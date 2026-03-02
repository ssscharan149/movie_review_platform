import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const navItemClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-semibold transition ${
    isActive ? "bg-[var(--brand)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
  }`;

export default function Navbar({ onMessage }) {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    onMessage("Logged out");
    navigate("/login");
  };

  return (
    <header className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/movies" className="text-lg font-black tracking-tight text-[var(--text-primary)]">
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
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] transition hover:opacity-90"
          >
            {isDark ? "Light" : "Dark"}
          </button>
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
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Signed in as <span className="font-semibold">{user.name}</span> ({user.role})
        </p>
      )}
    </header>
  );
}
