package com.sample.service;

import com.sample.dto.GenreRequest;
import com.sample.dto.GenreResponse;
import com.sample.entity.Genre;
import com.sample.repository.GenreRepository;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class GenreService {

    private final GenreRepository genreRepository;

    public GenreService(GenreRepository genreRepository) {
        this.genreRepository = genreRepository;
    }

    @Transactional
    public GenreResponse createGenre(GenreRequest request) {
        String normalizedName = request.getName().trim();

        if (genreRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Genre already exists");
        }

        Genre genre = new Genre();
        genre.setName(normalizedName);
        Genre saved = genreRepository.save(genre);
        return new GenreResponse(saved.getId(), saved.getName());
    }

    @Transactional(readOnly = true)
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(g -> new GenreResponse(g.getId(), g.getName()))
                .toList();
    }

    @Transactional
    public GenreResponse updateGenre(Long id, GenreRequest request) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Genre not found"));

        String normalizedName = request.getName().trim();
        if (!genre.getName().equalsIgnoreCase(normalizedName) && genreRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Genre already exists");
        }

        genre.setName(normalizedName);
        Genre saved = genreRepository.save(genre);
        return new GenreResponse(saved.getId(), saved.getName());
    }

    @Transactional
    public void deleteGenre(Long id) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Genre not found"));
        try {
            genreRepository.delete(genre);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete genre because it is used by movies");
        }
    }
}
