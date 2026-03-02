import { useEffect, useMemo, useState } from "react";
import client from "../api/client";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-200";

export default function AdminPage({ onMessage, onMoviesChanged }) {
  const [activeSection, setActiveSection] = useState("movies");
  const [genres, setGenres] = useState([]);
  const [editingGenreId, setEditingGenreId] = useState(null);
  const [editingGenreName, setEditingGenreName] = useState("");
  const [genreName, setGenreName] = useState("");
  const [isSubmittingGenre, setIsSubmittingGenre] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [movieActionLoading, setMovieActionLoading] = useState(false);
  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    releaseYear: "",
    posterUrl: "",
    trailerUrl: "",
    genreIds: [],
  });

  const hasGenres = useMemo(() => genres.length > 0, [genres]);

  const loadGenres = async () => {
    try {
      const { data } = await client.get("/genres");
      setGenres(data ?? []);
    } catch (error) {
      onMessage(`Failed to load genres: ${error.response?.data?.message || error.message}`, "error");
    }
  };

  useEffect(() => {
    loadGenres();
  }, []);

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

  const startEditGenre = (genre) => {
    setEditingGenreId(genre.id);
    setEditingGenreName(genre.name);
  };

  const cancelEditGenre = () => {
    setEditingGenreId(null);
    setEditingGenreName("");
  };

  const saveGenre = async (genreId) => {
    const cleanedName = editingGenreName.trim();
    if (!cleanedName) {
      onMessage("Genre name must not be empty.", "error");
      return;
    }
    try {
      await client.put(`/genres/${genreId}`, { name: cleanedName });
      onMessage("Genre updated", "success");
      cancelEditGenre();
      await loadGenres();
    } catch (error) {
      onMessage(parseApiError(error, "Genre update failed"), "error");
    }
  };

  const deleteGenre = async (genreId) => {
    try {
      await client.delete(`/genres/${genreId}`);
      onMessage("Genre deleted", "success");
      if (editingGenreId === genreId) {
        cancelEditGenre();
      }
      await loadGenres();
    } catch (error) {
      onMessage(parseApiError(error, "Genre delete failed"), "error");
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
        genreIds: exists ? prev.genreIds.filter((id) => id !== genreId) : [...prev.genreIds, genreId],
      };
    });
  };

  const buildMoviePayload = () => ({
    title: movieForm.title.trim(),
    description: movieForm.description.trim(),
    releaseYear: Number(movieForm.releaseYear),
    posterUrl: movieForm.posterUrl.trim() || null,
    trailerUrl: movieForm.trailerUrl.trim() || null,
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
      setMovieActionLoading(true);
      await client.post("/movies", payload);
      onMessage("Movie created", "success");
      setMovieForm({ title: "", description: "", releaseYear: "", posterUrl: "", trailerUrl: "", genreIds: [] });
      onMoviesChanged?.();
    } catch (error) {
      onMessage(parseApiError(error, "Movie create failed"), "error");
    } finally {
      setMovieActionLoading(false);
    }
  };

  const uploadPosterToCloudinary = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      onMessage("Missing Cloudinary config. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.", "error");
      return;
    }

    try {
      setIsUploadingPoster(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.secure_url) {
        throw new Error(data.error?.message || "Upload failed");
      }

      setMovieForm((prev) => ({ ...prev, posterUrl: data.secure_url }));
      onMessage("Poster uploaded", "success");
    } catch (error) {
      onMessage(`Poster upload failed: ${error.message}`, "error");
    } finally {
      setIsUploadingPoster(false);
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Admin Console</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Add movies quickly and manage genre names. Existing movies are edited from each movie detail page.
      </p>

      <div className="mt-4 inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-1">
        <button
          type="button"
          onClick={() => setActiveSection("movies")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeSection === "movies"
              ? "bg-[var(--brand)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
          }`}
        >
          Add Movie
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("genres")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeSection === "genres"
              ? "bg-[var(--brand)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
          }`}
        >
          Manage Genres
        </button>
      </div>

      {activeSection === "movies" && (
        <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Create New Movie</h2>
          <form onSubmit={createMovie} className="mt-3 grid gap-3">
            <input className={inputClass} name="title" placeholder="Title" value={movieForm.title} onChange={handleMovieField} />
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
            <input
              className={inputClass}
              name="posterUrl"
              type="url"
              placeholder="Poster URL (https://...)"
              value={movieForm.posterUrl}
              onChange={handleMovieField}
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
                Upload Poster
                <input type="file" accept="image/*" onChange={uploadPosterToCloudinary} className="hidden" />
              </label>
              {isUploadingPoster && (
                <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                  Uploading...
                </span>
              )}
            </div>
            <input
              className={inputClass}
              name="trailerUrl"
              type="url"
              placeholder="Trailer URL (YouTube/Vimeo)"
              value={movieForm.trailerUrl}
              onChange={handleMovieField}
            />
            {movieForm.posterUrl && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                <p className="mb-1 text-xs font-semibold text-[var(--text-secondary)]">Poster Preview</p>
                <img src={movieForm.posterUrl} alt="Poster preview" className="h-44 w-32 rounded object-contain" />
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">Genres</p>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <label
                    key={genre.id}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${
                      movieForm.genreIds.includes(genre.id)
                        ? "border-[var(--brand)] bg-blue-100 text-blue-800"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
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
              {!hasGenres && (
                <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                  No genres found. Add at least one genre in Manage Genres first.
                </p>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={movieActionLoading}
                className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
              >
                {movieActionLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />}
                {movieActionLoading ? "Creating..." : "Create Movie"}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeSection === "genres" && (
        <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Genre Management</h2>
          <form onSubmit={createGenre} className="mt-2 flex max-w-md gap-2">
            <input className={inputClass} placeholder="New genre" value={genreName} onChange={(e) => setGenreName(e.target.value)} />
            <button
              type="submit"
              disabled={isSubmittingGenre}
              className="inline-flex min-w-[90px] items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-70"
            >
              {isSubmittingGenre && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />}
              {isSubmittingGenre ? "Saving..." : "Add"}
            </button>
          </form>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {genres.map((genre) => (
              <li
                key={genre.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {editingGenreId === genre.id ? (
                  <div className="flex w-full items-center gap-2">
                    <input className={inputClass} value={editingGenreName} onChange={(e) => setEditingGenreName(e.target.value)} />
                    <button
                      type="button"
                      onClick={() => saveGenre(genre.id)}
                      className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditGenre}
                      className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{genre.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditGenre(genre)}
                        className="rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGenre(genre.id)}
                        className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          {!hasGenres && (
            <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text-secondary)]">
              No genres available. Add your first genre above.
            </div>
          )}
        </section>
      )}
    </div>
  );
}

