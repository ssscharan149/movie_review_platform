package com.sample.repository;

import com.sample.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    @Query(
            value = "SELECT DISTINCT m FROM Movie m LEFT JOIN m.genres g " +
                    "WHERE m.isDeleted = false " +
                    "AND (:search IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                    "AND (:genreId IS NULL OR g.id = :genreId)",
            countQuery = "SELECT COUNT(DISTINCT m.id) FROM Movie m LEFT JOIN m.genres g " +
                    "WHERE m.isDeleted = false " +
                    "AND (:search IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                    "AND (:genreId IS NULL OR g.id = :genreId)"
    )
    Page<Movie> findActiveMovies(
            @Param("search") String search,
            @Param("genreId") Long genreId,
            Pageable pageable
    );

    Optional<Movie> findByIdAndIsDeletedFalse(Long id);
}
