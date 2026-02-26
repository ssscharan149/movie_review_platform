package com.sample.repository;

import com.sample.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByMovieIdAndUserId(Long movieId, Long userId);

    Page<Review> findByMovieIdOrderByCreatedAtDesc(Long movieId, Pageable pageable);
}
