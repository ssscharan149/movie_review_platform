import { useEffect, useMemo, useState } from "react";
import client from "../api/client";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export default function AdminPage({ onMessage, onMoviesChanged }) {
  const [activeSection, setActiveSection] = useState("movies");
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [genreName, setGenreName] = useState("");
  const [isSubmittingGenre, setIsSubmittingGenre] = useState(false);
  const [movieActionLoading, setMovieActionLoading] = useState({
    create: false,
    update: false,
    delete: false,
  });
  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    releaseYear: "",
    genreIds: [],
  });

  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId) ?? null,
    [movies, selectedMovieId]
  );

  const loadGenres = async () => {
    try {
      const { data } = await client.get("/genres");
      setGenres(data ?? []);
    } catch (error) {
      onMessage(`Failed to load genres: ${error.response?.data?.message || error.message}`, "error");
    }
  };

  const loadMovies = async () => {
    try {
      const { data } = await client.get("/movies?page=0&size=50");
      setMovies(data.content ?? []);
    } catch (error) {
      onMessage(`Failed to load movies: ${error.response?.data?.message || error.message}`, "error");
    }
  };

  useEffect(() => {
    loadGenres();
    loadMovies();
  }, []);

  useEffect(() => {
    if (!selectedMovie) return;
    setMovieForm({
      title: selectedMovie.title,
      description: selectedMovie.description,
      releaseYear: String(selectedMovie.releaseYear),
      genreIds: selectedMovie.genres
        .map((name) => genres.find((genre) => genre.name === name)?.id)
        .filter(Boolean),
    });
  }, [selectedMovie, genres]);

  const parseApiError = (error, fallback) => {
    const message = error.response?.data?.message || fallback;
    const details = error.response?.data?.details;
    if (!details) return message;
    return `${message} | ${Object.entries(details)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}`;
  };

  const createGenre = async (event) => {
    event.preventDefault();
    const cleanedName = genreName.trim();
    if (!cleanedName) {
      onMessage("Genre name must not be empty.", "error");
      return;
    }
    try {
      setIsSubmittingGenre(true);
      await client.post("/genres", { name: cleanedName });
      setGenreName("");
      onMessage("Genre created", "success");
      await loadGenres();
    } catch (error) {
      onMessage(parseApiError(error, "Genre create failed"), "error");
    } finally {
      setIsSubmittingGenre(false);
    }
  };

  const handleMovieField = (event) => {
    const { name, value } = event.target;
    setMovieForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleGenreId = (genreId) => {
    setMovieForm((prev) => {
      const exists = prev.genreIds.includes(genreId);
      return {
        ...prev,
        genreIds: exists
          ? prev.genreIds.filter((id) => id !== genreId)
          : [...prev.genreIds, genreId],
      };
    });
  };

  const buildMoviePayload = () => ({
    title: movieForm.title.trim(),
    description: movieForm.description.trim(),
    releaseYear: Number(movieForm.releaseYear),
    genreIds: movieForm.genreIds,
  });

  const validateMoviePayload = (payload) => {
    if (!payload.title || !payload.description || !payload.releaseYear) {
      onMessage("Movie title, description, and release year are required.", "error");
      return false;
    }
    if (!Number.isInteger(payload.releaseYear)) {
      onMessage("Release year must be a valid number.", "error");
      return false;
    }
    return true;
  };

  const createMovie = async (event) => {
    event.preventDefault();
    const payload = buildMoviePayload();
    if (!validateMoviePayload(payload)) return;
    try {
      setMovieActionLoading((prev) => ({ ...prev, create: true }));
      await client.post("/movies", payload);
      onMessage("Movie created", "success");
      setSelectedMovieId(null);
      setMovieForm({ title: "", description: "", releaseYear: "", genreIds: [] });
      await loadMovies();
      onMoviesChanged?.();
    } catch (error) {
      onMessage(parseApiError(error, "Movie create failed"), "error");
    } finally {
      setMovieActionLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const updateMovie = async () => {
    if (!selectedMovieId) {
      onMessage("Select a movie first.", "error");
      return;
    }
    const payload = buildMoviePayload();
    if (!validateMoviePayload(payload)) return;
    try {
      setMovieActionLoading((prev) => ({ ...prev, update: true }));
      await client.put(`/movies/${selectedMovieId}`, payload);
      onMessage("Movie updated", "success");
      await loadMovies();
      onMoviesChanged?.();
    } catch (error) {
      onMessage(parseApiError(error, "Movie update failed"), "error");
    } finally {
      setMovieActionLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const deleteMovie = async () => {
    if (!selectedMovieId) {
      onMessage("Select a movie first.", "error");
      return;
    }
    try {
      setMovieActionLoading((prev) => ({ ...prev, delete: true }));
      await client.delete(`/movies/${selectedMovieId}`);
      onMessage("Movie deleted", "success");
      setSelectedMovieId(null);
      setMovieForm({ title: "", description: "", releaseYear: "", genreIds: [] });
      await loadMovies();
      onMoviesChanged?.();
    } catch (error) {
      onMessage(parseApiError(error, "Movie delete failed"), "error");
    } finally {
      setMovieActionLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Admin Console</h1>
      <p className="mt-1 text-sm text-slate-600">Manage genres and movie details in separate sections.</p>

      <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setActiveSection("movies")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeSection === "movies"
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-200"
          }`}
        >
          Movie Management
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("genres")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeSection === "genres"
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-200"
          }`}
        >
          Genre Management
        </button>
      </div>

      {activeSection === "genres" && (
        <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Create Genre</h2>
          <form onSubmit={createGenre} className="mt-2 flex max-w-md gap-2">
            <input
              className={inputClass}
              placeholder="New genre"
              value={genreName}
              onChange={(e) => setGenreName(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSubmittingGenre}
              className="inline-flex min-w-[90px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
            >
              {isSubmittingGenre && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />}
              {isSubmittingGenre ? "Saving..." : "Add"}
            </button>
          </form>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {genres.map((genre) => (
              <li key={genre.id} className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                {genre.name}
              </li>
            ))}
          </ul>
          {genres.length === 0 && (
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-700">
              No genres available. Add your first genre above.
            </div>
          )}
        </section>
      )}

      {activeSection === "movies" && (
        <section className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Select Movie</h2>
            <ul className="mt-3 space-y-2">
              {movies.map((movie) => (
                <li key={movie.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedMovieId(movie.id)}
                    className={`w-full rounded-lg border px-2 py-2 text-left text-sm ${
                      selectedMovieId === movie.id
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {movie.title}
                  </button>
                </li>
              ))}
            </ul>
            {movies.length === 0 && (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-700">
                No movies available. Create your first movie from the form.
              </div>
            )}
          </aside>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              {selectedMovieId ? "Update Selected Movie" : "Create New Movie"}
            </h2>
            <form onSubmit={createMovie} className="mt-3 grid gap-3">
              <input
                className={inputClass}
                name="title"
                placeholder="Title"
                value={movieForm.title}
                onChange={handleMovieField}
              />
              <textarea
                className={inputClass}
                name="description"
                rows="4"
                placeholder="Description"
                value={movieForm.description}
                onChange={handleMovieField}
              />
              <input
                className={inputClass}
                name="releaseYear"
                type="number"
                placeholder="Release year"
                value={movieForm.releaseYear}
                onChange={handleMovieField}
              />

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <label
                      key={genre.id}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${
                        movieForm.genreIds.includes(genre.id)
                          ? "border-blue-600 bg-blue-100 text-blue-800"
                          : "border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={movieForm.genreIds.includes(genre.id)}
                        onChange={() => toggleGenreId(genre.id)}
                        className="hidden"
                      />
                      {genre.name}
                    </label>
                  ))}
                </div>
                {genres.length === 0 && (
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    No genres found. Create genres first in Genre Management.
                  </p>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={movieActionLoading.create}
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                >
                  {movieActionLoading.create && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />}
                  {movieActionLoading.create ? "Creating..." : "Create Movie"}
                </button>
                <button
                  type="button"
                  onClick={updateMovie}
                  disabled={movieActionLoading.update}
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-70"
                >
                  {movieActionLoading.update && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />}
                  {movieActionLoading.update ? "Updating..." : "Update Selected"}
                </button>
                <button
                  type="button"
                  onClick={deleteMovie}
                  disabled={movieActionLoading.delete}
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70"
                >
                  {movieActionLoading.delete && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />}
                  {movieActionLoading.delete ? "Deleting..." : "Delete Selected"}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
