package com.sample.repository;

import com.sample.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByMovieIdAndUserId(Long movieId, Long userId);

    @Query("SELECT COALESCE(AVG(r.score), 0) FROM Rating r WHERE r.movie.id = :movieId")
    double getAverageScoreByMovieId(Long movieId);

    long countByMovieId(Long movieId);
}
