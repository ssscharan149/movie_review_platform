import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import client from "./api/client";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import MoviesPage from "./pages/MoviesPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";

function AppShell() {
  const [message, setMessage] = useState("");
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
      setMessage(`Failed to load movies: ${error.response?.data?.message || error.message}`);
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

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">
      <Navbar onMessage={setMessage} />

      {message && (
        <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
          {message}
        </p>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/movies" replace />} />
        <Route path="/login" element={<LoginPage onMessage={setMessage} />} />
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
        <Route path="/movies/:movieId" element={<MovieDetailPage onMessage={setMessage} />} />
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
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
