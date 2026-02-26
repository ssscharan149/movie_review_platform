package com.sample.service;

import com.sample.dto.MovieRequest;
import com.sample.dto.MovieResponse;
import com.sample.entity.Genre;
import com.sample.entity.Movie;
import com.sample.repository.GenreRepository;
import com.sample.repository.MovieRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MovieService {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;

    public MovieService(MovieRepository movieRepository, GenreRepository genreRepository) {
        this.movieRepository = movieRepository;
        this.genreRepository = genreRepository;
    }

    @Transactional
    public MovieResponse createMovie(MovieRequest request) {
        Movie movie = new Movie();
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setReleaseYear(request.getReleaseYear());
        movie.setGenres(resolveGenres(request.getGenreIds()));
        movie.setIsDeleted(false);

        Movie saved = movieRepository.save(movie);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<MovieResponse> getAllMovies(String search, Long genreId, Pageable pageable) {
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();
        return movieRepository.findActiveMovies(normalizedSearch, genreId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public MovieResponse getMovieById(Long id) {
        Movie movie = getActiveMovieOrThrow(id);
        return toResponse(movie);
    }

    @Transactional
    public MovieResponse updateMovie(Long id, MovieRequest request) {
        Movie movie = getActiveMovieOrThrow(id);
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setReleaseYear(request.getReleaseYear());
        movie.setGenres(resolveGenres(request.getGenreIds()));

        Movie saved = movieRepository.save(movie);
        return toResponse(saved);
    }

    @Transactional
    public void deleteMovie(Long id) {
        Movie movie = getActiveMovieOrThrow(id);
        movie.setIsDeleted(true);
        movieRepository.save(movie);
    }

    private Movie getActiveMovieOrThrow(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        if (Boolean.TRUE.equals(movie.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
        }

        return movie;
    }

    private Set<Genre> resolveGenres(Set<Long> genreIds) {
        if (genreIds == null || genreIds.isEmpty()) {
            return new HashSet<>();
        }

        Set<Genre> genres = genreRepository.findByIdIn(genreIds);

        if (genres.size() != genreIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more genreIds are invalid");
        }

        return genres;
    }

    private MovieResponse   toResponse(Movie movie) {
        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getDescription(),
                movie.getReleaseYear(),
                movie.getGenres().stream().map(Genre::getName).collect(Collectors.toSet()),
                movie.getCreatedAt(),
                movie.getUpdatedAt()
        );
    }
}