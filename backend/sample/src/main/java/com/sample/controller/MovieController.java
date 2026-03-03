package com.sample.controller;

import com.sample.dto.MovieRequest;
import com.sample.dto.MovieResponse;
import com.sample.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @PostMapping
    public ResponseEntity<MovieResponse> createMovie(@Valid @RequestBody MovieRequest request) {
        MovieResponse response = movieService.createMovie(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public Page<MovieResponse> getAllMovies(
            @RequestParam(defaultValue ="0") int page,
            @RequestParam(defaultValue = "3") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long genreId
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return movieService.getAllMovies(search, genreId, pageable);
    }

    @GetMapping("/{id}")
    public MovieResponse getMovieById(@PathVariable Long id) {
        return movieService.getMovieById(id);
    }

    @PutMapping("/{id}")
    public MovieResponse updateMovie(@PathVariable Long id, @Valid @RequestBody MovieRequest request) {
        return movieService.updateMovie(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }
}
