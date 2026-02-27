package com.sample.repository;

import com.sample.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByMovieIdAndUserId(Long movieId, Long userId);

    @Query(
            value = "SELECT r FROM Review r JOIN r.user u WHERE r.movie.id = :movieId ORDER BY r.createdAt DESC",
            countQuery = "SELECT COUNT(r) FROM Review r JOIN r.user u WHERE r.movie.id = :movieId"
    )
    Page<Review> findByMovieIdOrderByCreatedAtDesc(@Param("movieId") Long movieId, Pageable pageable);
}
