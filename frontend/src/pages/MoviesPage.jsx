import { Link } from "react-router-dom";

export default function MoviesPage({ movies, loading, page, totalPages, totalElements, onPageChange }) {
  const hasPrev = page > 0;
  const hasNext = totalPages > 0 && page < totalPages - 1;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Movies</h1>
          <p className="text-sm text-[var(--text-secondary)]">Pick a movie and view ratings/reviews in detail.</p>
        </div>
        <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
          {totalElements} total
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading movies...</p>
      ) : movies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-sm text-[var(--text-secondary)]">
          No movies available yet. If you are an admin, go to <span className="font-semibold">Admin</span> and create your first movie.
        </div>
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {movies.map((movie) => (
              <li key={movie.id}>
                <Link
                  to={`/movies/${movie.id}`}
                  className="fade-slide-up block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="flex h-56 items-center justify-center bg-[var(--surface-soft)]">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={`${movie.title} poster`}
                        className="h-full w-full object-contain p-2 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
                        Poster N/A
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="line-clamp-1 text-base font-semibold text-[var(--text-primary)]">{movie.title}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{movie.releaseYear}</div>
                    <p className="mt-2 line-clamp-3 text-sm text-[var(--text-secondary)]">{movie.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--text-secondary)]">
              Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
