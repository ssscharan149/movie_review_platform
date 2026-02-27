import { Link } from "react-router-dom";

export default function MoviesPage({ movies, loading, page, totalPages, totalElements, onPageChange }) {
  const hasPrev = page > 0;
  const hasNext = totalPages > 0 && page < totalPages - 1;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Movies</h1>
          <p className="text-sm text-slate-600">Pick a movie and view ratings/reviews in detail.</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {totalElements} total
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading movies...</p>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {movies.map((movie) => (
              <li key={movie.id}>
                <Link
                  to={`/movies/${movie.id}`}
                  className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="text-base font-semibold text-slate-900">{movie.title}</div>
                  <div className="text-xs text-slate-500">{movie.releaseYear}</div>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-700">{movie.description}</p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
