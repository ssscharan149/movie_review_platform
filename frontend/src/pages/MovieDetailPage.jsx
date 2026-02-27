import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function MovieDetailPage({ onMessage }) {
  const { movieId } = useParams();
  const { isLoggedIn, user } = useAuth();
  const [movie, setMovie] = useState(null);
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

  const sanitizeText = (value) => value.replace(/[<>"'`]/g, "").trim();

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
  }, [movieId]);

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
      const nextPage =
        reviews.length === 1 && reviewPage.page > 0 ? reviewPage.page - 1 : reviewPage.page;
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

  if (!movie) {
    return <p className="text-sm text-slate-600">Loading movie details...</p>;
  }

  const hasPrevReviews = reviewPage.page > 0;
  const hasNextReviews = reviewPage.totalPages > 0 && reviewPage.page < reviewPage.totalPages - 1;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{movie.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{movie.description}</p>
      <p className="mt-3 text-sm text-slate-700">
        <span className="font-semibold">Genres:</span> {(movie.genres ?? []).join(", ") || "N/A"}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        <span className="font-semibold">Average Rating:</span> {ratingSummary?.averageScore?.toFixed?.(2) ?? "0.00"} ({ratingSummary?.totalRatings ?? 0} votes)
      </p>

      {isLoggedIn && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Your Rating</h2>
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
                className={`w-20 rounded-lg border px-2 py-2 text-sm ${formErrors.rating ? "border-rose-400" : "border-slate-300"}`}
              />
              <button onClick={submitRating} type="button" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Submit
              </button>
            </div>
            {formErrors.rating && <p className="mt-2 text-xs font-medium text-rose-600">{formErrors.rating}</p>}
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Add Review</h2>
            <textarea
              rows="4"
              placeholder="Write review (20-2000 chars)"
              value={reviewInput}
              onChange={(e) => {
                setReviewInput(e.target.value);
                setFormErrors((prev) => ({ ...prev, review: "" }));
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${formErrors.review ? "border-rose-400" : "border-slate-300"}`}
            />
            {formErrors.review && <p className="mt-2 text-xs font-medium text-rose-600">{formErrors.review}</p>}
            <button onClick={submitReview} type="button" className="mt-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Submit Review
            </button>
          </section>
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
        <p className="mt-1 text-xs text-slate-600">{reviewPage.totalElements} total reviews</p>
        <ul className="mt-3 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">{review.userName}</div>
              {editingReviewId === review.id ? (
                <div className="mt-2">
                  <textarea
                    rows="4"
                    value={editReviewInput}
                    onChange={(e) => {
                      setEditReviewInput(e.target.value);
                      setEditReviewError("");
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${editReviewError ? "border-rose-400" : "border-slate-300"}`}
                  />
                  {editReviewError && <p className="mt-1 text-xs font-medium text-rose-600">{editReviewError}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => saveEditedReview(review.id)}
                      type="button"
                      className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditReview}
                      type="button"
                      className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-700">{review.content}</p>
              )}
              {isLoggedIn && editingReviewId !== review.id && (
                <div className="mt-2 flex items-center gap-2">
                  {user?.userId === review.userId && (
                    <button
                      onClick={() => beginEditReview(review)}
                      type="button"
                      className="rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      Edit
                    </button>
                  )}
                  {(user?.userId === review.userId || user?.role === "ADMIN") && (
                    <button
                      onClick={() => deleteReview(review.id)}
                      type="button"
                      className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        {reviews.length === 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
            No reviews yet for this movie.
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={!hasPrevReviews}
            onClick={() => loadDetails(reviewPage.page - 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {reviewPage.totalPages === 0 ? 0 : reviewPage.page + 1} of {reviewPage.totalPages}
          </span>
          <button
            type="button"
            disabled={!hasNextReviews}
            onClick={() => loadDetails(reviewPage.page + 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </section>
    </section>
  );
}
