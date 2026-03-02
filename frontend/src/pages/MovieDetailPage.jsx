import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-200";

export default function MovieDetailPage({ onMessage }) {
  const navigate = useNavigate();
  const { movieId } = useParams();
  const { isLoggedIn, user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [genres, setGenres] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewInput, setReviewInput] = useState("");
  const [formErrors, setFormErrors] = useState({ rating: "", review: "" });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewInput, setEditReviewInput] = useState("");
  const [editReviewError, setEditReviewError] = useState("");
  const [reviewPage, setReviewPage] = useState({
    page: 0,
    size: 5,
    totalPages: 0,
    totalElements: 0,
  });

  const [movieEditMode, setMovieEditMode] = useState(false);
  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    releaseYear: "",
    posterUrl: "",
    trailerUrl: "",
    genreIds: [],
  });
  const [movieActionLoading, setMovieActionLoading] = useState({
    update: false,
    delete: false,
  });

  const isAdmin = isLoggedIn && user?.role === "ADMIN";

  const sanitizeText = (value) => value.replace(/[<>"'`]/g, "").trim();

  const toEmbedUrl = (rawUrl) => {
    if (!rawUrl) return null;
    try {
      const url = new URL(rawUrl);
      if (url.hostname.includes("youtube.com")) {
        const id = url.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (url.hostname.includes("youtu.be")) {
        const id = url.pathname.replace("/", "");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (url.hostname.includes("vimeo.com")) {
        const id = url.pathname.split("/").filter(Boolean).pop();
        return id ? `https://player.vimeo.com/video/${id}` : null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadGenres = async () => {
    try {
      const { data } = await client.get("/genres");
      setGenres(data ?? []);
    } catch (error) {
      onMessage(`Failed to load genres: ${error.response?.data?.message || error.message}`, "error");
    }
  };

  const loadDetails = async (page = reviewPage.page) => {
    try {
      const [movieRes, reviewsRes, summaryRes] = await Promise.all([
        client.get(`/movies/${movieId}`),
        client.get(`/movies/${movieId}/reviews?page=${page}&size=${reviewPage.size}`),
        client.get(`/movies/${movieId}/rating-summary`),
      ]);
      setMovie(movieRes.data);
      setReviews(reviewsRes.data?.content ?? []);
      setReviewPage((prev) => ({
        ...prev,
        page: reviewsRes.data?.number ?? page,
        totalPages: reviewsRes.data?.totalPages ?? 0,
        totalElements: reviewsRes.data?.totalElements ?? 0,
      }));
      setRatingSummary(summaryRes.data);
      setEditingReviewId(null);
      setEditReviewInput("");
      setEditReviewError("");
    } catch (error) {
      onMessage(`Failed to load movie details: ${error.response?.data?.message || error.message}`);
    }
  };

  useEffect(() => {
    setReviewPage((prev) => ({ ...prev, page: 0 }));
    loadDetails(0);
    if (isAdmin) {
      loadGenres();
    }
  }, [movieId]);

  useEffect(() => {
    if (!movie) return;
    const selectedGenreIds = (movie.genres ?? [])
      .map((name) => genres.find((genre) => genre.name === name)?.id)
      .filter(Boolean);
    setMovieForm({
      title: movie.title,
      description: movie.description,
      releaseYear: String(movie.releaseYear ?? ""),
      posterUrl: movie.posterUrl ?? "",
      trailerUrl: movie.trailerUrl ?? "",
      genreIds: selectedGenreIds,
    });
  }, [movie, genres]);

  const toggleGenreId = (genreId) => {
    setMovieForm((prev) => {
      const exists = prev.genreIds.includes(genreId);
      return {
        ...prev,
        genreIds: exists ? prev.genreIds.filter((id) => id !== genreId) : [...prev.genreIds, genreId],
      };
    });
  };

  const submitRating = async () => {
    const parsed = Number(ratingInput);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
      setFormErrors((prev) => ({ ...prev, rating: "Rating must be an integer between 1 and 5" }));
      onMessage("Please fix rating input before submitting.");
      return;
    }

    setFormErrors((prev) => ({ ...prev, rating: "" }));
    try {
      await client.put(`/movies/${movieId}/rating`, { score: parsed });
      onMessage("Rating submitted");
      await loadDetails();
    } catch (error) {
      onMessage(`Rating failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const submitReview = async () => {
    const cleanedReview = sanitizeText(reviewInput);
    if (!cleanedReview) {
      setFormErrors((prev) => ({ ...prev, review: "Review must not be empty" }));
      onMessage("Please enter a review before submitting.");
      return;
    }
    if (cleanedReview.length < 20 || cleanedReview.length > 2000) {
      setFormErrors((prev) => ({ ...prev, review: "Review must be between 20 and 2000 characters" }));
      onMessage("Please fix review length before submitting.");
      return;
    }

    setFormErrors((prev) => ({ ...prev, review: "" }));
    try {
      await client.post(`/movies/${movieId}/reviews`, { content: cleanedReview });
      setReviewInput("");
      onMessage("Review added");
      await loadDetails(0);
    } catch (error) {
      const details = error.response?.data?.details;
      const detailText = details
        ? ` | ${Object.entries(details)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}`
        : "";
      onMessage(`Review failed: ${error.response?.data?.message || error.message}${detailText}`);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await client.delete(`/reviews/${reviewId}`);
      onMessage("Review deleted");
      const nextPage = reviews.length === 1 && reviewPage.page > 0 ? reviewPage.page - 1 : reviewPage.page;
      await loadDetails(nextPage);
    } catch (error) {
      onMessage(`Delete failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const beginEditReview = (review) => {
    setEditingReviewId(review.id);
    setEditReviewInput(review.content);
    setEditReviewError("");
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditReviewInput("");
    setEditReviewError("");
  };

  const saveEditedReview = async (reviewId) => {
    const cleanedReview = sanitizeText(editReviewInput);
    if (!cleanedReview) {
      setEditReviewError("Review must not be empty");
      onMessage("Please enter review text before saving.");
      return;
    }
    if (cleanedReview.length < 20 || cleanedReview.length > 2000) {
      setEditReviewError("Review must be between 20 and 2000 characters");
      onMessage("Please fix edited review length before saving.");
      return;
    }

    try {
      await client.put(`/reviews/${reviewId}`, { content: cleanedReview });
      onMessage("Review updated");
      await loadDetails(reviewPage.page);
    } catch (error) {
      onMessage(`Update failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const updateMovie = async () => {
    const payload = {
      title: movieForm.title.trim(),
      description: movieForm.description.trim(),
      releaseYear: Number(movieForm.releaseYear),
      posterUrl: movieForm.posterUrl.trim() || null,
      trailerUrl: movieForm.trailerUrl.trim() || null,
      genreIds: movieForm.genreIds,
    };
    if (!payload.title || !payload.description || !payload.releaseYear) {
      onMessage("Title, description, and release year are required.", "error");
      return;
    }
    if (!Number.isInteger(payload.releaseYear)) {
      onMessage("Release year must be a valid number.", "error");
      return;
    }

    try {
      setMovieActionLoading((prev) => ({ ...prev, update: true }));
      await client.put(`/movies/${movieId}`, payload);
      onMessage("Movie updated", "success");
      setMovieEditMode(false);
      await loadDetails(reviewPage.page);
    } catch (error) {
      onMessage(`Movie update failed: ${error.response?.data?.message || error.message}`, "error");
    } finally {
      setMovieActionLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const deleteMovie = async () => {
    try {
      setMovieActionLoading((prev) => ({ ...prev, delete: true }));
      await client.delete(`/movies/${movieId}`);
      onMessage("Movie deleted", "success");
      navigate("/movies");
    } catch (error) {
      onMessage(`Movie delete failed: ${error.response?.data?.message || error.message}`, "error");
    } finally {
      setMovieActionLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const selectedGenreLabels = useMemo(
    () =>
      genres
        .filter((g) => movieForm.genreIds.includes(g.id))
        .map((g) => g.name),
    [genres, movieForm.genreIds]
  );

  if (!movie) {
    return <p className="text-sm text-[var(--text-secondary)]">Loading movie details...</p>;
  }

  const hasPrevReviews = reviewPage.page > 0;
  const hasNextReviews = reviewPage.totalPages > 0 && reviewPage.page < reviewPage.totalPages - 1;

  return (
    <section className="fade-slide-up rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{movie.title}</h1>
          <p className="text-xs text-[var(--text-secondary)]">Movie ID: {movie.id}</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setMovieEditMode((prev) => !prev)}
            className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {movieEditMode ? "Cancel Edit" : "Edit"}
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="h-80 w-full max-w-[240px] overflow-hidden rounded-2xl bg-[var(--surface-soft)] shadow-sm">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={`${movie.title} poster`} className="h-full w-full object-contain p-2" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">Poster N/A</div>
          )}
        </div>

        {!movieEditMode ? (
          <div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{movie.description}</p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Genres:</span> {(movie.genres ?? []).join(", ") || "N/A"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Average Rating:</span>{" "}
              {ratingSummary?.averageScore?.toFixed?.(2) ?? "0.00"} ({ratingSummary?.totalRatings ?? 0} votes)
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Edit Movie</h2>
            <div className="grid gap-3">
              <input className={inputClass} name="title" value={movieForm.title} onChange={(e) => setMovieForm((p) => ({ ...p, title: e.target.value }))} />
              <textarea
                className={inputClass}
                rows="4"
                name="description"
                value={movieForm.description}
                onChange={(e) => setMovieForm((p) => ({ ...p, description: e.target.value }))}
              />
              <input
                className={inputClass}
                type="number"
                name="releaseYear"
                value={movieForm.releaseYear}
                onChange={(e) => setMovieForm((p) => ({ ...p, releaseYear: e.target.value }))}
              />
              <input
                className={inputClass}
                type="url"
                name="posterUrl"
                placeholder="Poster URL"
                value={movieForm.posterUrl}
                onChange={(e) => setMovieForm((p) => ({ ...p, posterUrl: e.target.value }))}
              />
              <input
                className={inputClass}
                type="url"
                name="trailerUrl"
                placeholder="Trailer URL"
                value={movieForm.trailerUrl}
                onChange={(e) => setMovieForm((p) => ({ ...p, trailerUrl: e.target.value }))}
              />

              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Genres</p>
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
                {selectedGenreLabels.length > 0 && (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">Selected: {selectedGenreLabels.join(", ")}</p>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={updateMovie}
                  disabled={movieActionLoading.update}
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                >
                  {movieActionLoading.update && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />}
                  {movieActionLoading.update ? "Updating..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={deleteMovie}
                  disabled={movieActionLoading.delete}
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70"
                >
                  {movieActionLoading.delete && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />}
                  {movieActionLoading.delete ? "Deleting..." : "Delete Movie"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toEmbedUrl(movie.trailerUrl) && (
        <section className="fade-slide-up mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Trailer</h2>
          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-black">
            <iframe
              className="h-52 w-full md:h-60"
              src={toEmbedUrl(movie.trailerUrl)}
              title={`${movie.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {isLoggedIn && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="fade-slide-up rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Your Rating</h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="5"
                value={ratingInput}
                onChange={(e) => {
                  setRatingInput(e.target.value);
                  setFormErrors((prev) => ({ ...prev, rating: "" }));
                }}
                className={`w-20 rounded-lg border px-2 py-2 text-sm ${formErrors.rating ? "border-rose-400" : "border-[var(--border)]"}`}
              />
              <button onClick={submitRating} type="button" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Submit
              </button>
            </div>
            {formErrors.rating && <p className="mt-2 text-xs font-medium text-rose-600">{formErrors.rating}</p>}
          </section>

          <section className="fade-slide-up rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Add Review</h2>
            <textarea
              rows="4"
              placeholder="Write review (20-2000 chars)"
              value={reviewInput}
              onChange={(e) => {
                setReviewInput(e.target.value);
                setFormErrors((prev) => ({ ...prev, review: "" }));
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${formErrors.review ? "border-rose-400" : "border-[var(--border)]"}`}
            />
            {formErrors.review && <p className="mt-2 text-xs font-medium text-rose-600">{formErrors.review}</p>}
            <button onClick={submitReview} type="button" className="mt-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
              Submit Review
            </button>
          </section>
        </div>
      )}

      <section className="fade-slide-up mt-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reviews</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{reviewPage.totalElements} total reviews</p>
        <ul className="mt-3 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="text-sm font-semibold text-[var(--text-primary)]">{review.userName}</div>
              {editingReviewId === review.id ? (
                <div className="mt-2">
                  <textarea
                    rows="4"
                    value={editReviewInput}
                    onChange={(e) => {
                      setEditReviewInput(e.target.value);
                      setEditReviewError("");
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${editReviewError ? "border-rose-400" : "border-[var(--border)]"}`}
                  />
                  {editReviewError && <p className="mt-1 text-xs font-medium text-rose-600">{editReviewError}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => saveEditedReview(review.id)} type="button" className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Save
                    </button>
                    <button onClick={cancelEditReview} type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{review.content}</p>
              )}
              {isLoggedIn && editingReviewId !== review.id && (
                <div className="mt-2 flex items-center gap-2">
                  {user?.userId === review.userId && (
                    <button onClick={() => beginEditReview(review)} type="button" className="rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                      Edit
                    </button>
                  )}
                  {(user?.userId === review.userId || user?.role === "ADMIN") && (
                    <button onClick={() => deleteReview(review.id)} type="button" className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                      Delete
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        {reviews.length === 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-secondary)]">
            No reviews yet for this movie.
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={!hasPrevReviews}
            onClick={() => loadDetails(reviewPage.page - 1)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--text-secondary)]">
            Page {reviewPage.totalPages === 0 ? 0 : reviewPage.page + 1} of {reviewPage.totalPages}
          </span>
          <button
            type="button"
            disabled={!hasNextReviews}
            onClick={() => loadDetails(reviewPage.page + 1)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </section>
    </section>
  );
}

