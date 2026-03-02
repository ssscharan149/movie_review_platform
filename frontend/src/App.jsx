import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import client from "./api/client";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastStack from "./components/ToastStack";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import MoviesPage from "./pages/MoviesPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";

function AppShell() {
  const [toasts, setToasts] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [moviePage, setMoviePage] = useState({
    page: 0,
    size: 9,
    totalPages: 0,
    totalElements: 0,
  });

  const loadMovies = async (page = 0) => {
    setLoadingMovies(true);
    try {
      const { data } = await client.get(`/movies?page=${page}&size=${moviePage.size}`);
      setMovies(data.content ?? []);
      setMoviePage((prev) => ({
        ...prev,
        page: data.number ?? page,
        totalPages: data.totalPages ?? 0,
        totalElements: data.totalElements ?? 0,
      }));
    } catch (error) {
      notify(`Failed to load movies: ${error.response?.data?.message || error.message}`, "error");
    } finally {
      setLoadingMovies(false);
    }
  };

  useEffect(() => {
    loadMovies(0);
  }, []);

  const goToMoviesPage = (nextPage) => {
    if (nextPage < 0) return;
    if (moviePage.totalPages > 0 && nextPage >= moviePage.totalPages) return;
    loadMovies(nextPage);
  };

  const notify = (message, type = "info") => {
    const nextId = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id: nextId, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== nextId));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 text-[var(--text-primary)]">
      <ToastStack toasts={toasts} onClose={dismissToast} />
      <Navbar onMessage={notify} />

      <Routes>
        <Route path="/" element={<Navigate to="/movies" replace />} />
        <Route path="/login" element={<LoginPage onMessage={notify} />} />
        <Route
          path="/movies"
          element={
            <MoviesPage
              movies={movies}
              loading={loadingMovies}
              page={moviePage.page}
              totalPages={moviePage.totalPages}
              totalElements={moviePage.totalElements}
              onPageChange={goToMoviesPage}
            />
          }
        />
        <Route path="/movies/:movieId" element={<MovieDetailPage onMessage={notify} />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage onMessage={notify} onMoviesChanged={() => loadMovies(moviePage.page)} />
            </AdminRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
