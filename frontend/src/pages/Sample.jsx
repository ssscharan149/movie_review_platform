import { useEffect, useState } from "react";
import client from "../api/client";

export default function Sample() {
  const [movies, setMovies] = useState([]);
  const [message, setMessage] = useState("Loading movies...");

  useEffect(() => {
    client
      .get("/movies?page=0")
      .then((res) => {
        const movieList = res.data?.content ?? [];
        setMovies(movieList);
        setMessage(movieList.length ? "" : "No movies yet. Add one with POST /api/movies.");
      })
      .catch((err) => setMessage("Error: " + (err.response?.data?.message || err.message)));
  }, []);

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Movie List</h1>
      {message && <p>{message}</p>}
      <ul>
        {movies.map((movie) => (
          <li key={movie.id} style={{ marginBottom: "1rem" }}>
            <strong>{movie.title}</strong> ({movie.releaseYear})
            <div>{movie.description}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}