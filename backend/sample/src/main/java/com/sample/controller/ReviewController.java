package com.sample.controller;

import com.sample.dto.ReviewRequest;
import com.sample.dto.ReviewResponse;
import com.sample.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/api/movies/{movieId}/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long movieId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        ReviewResponse response = reviewService.createReview(movieId, authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/movies/{movieId}/reviews")
    public Page<ReviewResponse> getMovieReviews(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewService.getMovieReviews(movieId, pageable);
    }

    @PutMapping("/api/reviews/{reviewId}")
    public ReviewResponse updateMyReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        return reviewService.updateMyReview(reviewId, authentication.getName(), request);
    }

    @DeleteMapping("/api/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication
    ) {
        reviewService.deleteReview(reviewId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
