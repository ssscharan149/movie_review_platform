package com.sample.controller;

import com.sample.dto.RatingRequest;
import com.sample.dto.RatingResponse;
import com.sample.dto.RatingSummaryResponse;
import com.sample.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movies/{movieId}")
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @PutMapping("/rating")
    public RatingResponse upsertRating(
            @PathVariable Long movieId,
            @Valid @RequestBody RatingRequest request,
            Authentication authentication
    ) {
        return ratingService.upsertRating(movieId, authentication.getName(), request);
    }

    @DeleteMapping("/rating")
    public ResponseEntity<Void> deleteMyRating(
            @PathVariable Long movieId,
            Authentication authentication
    ) {
        ratingService.deleteMyRating(movieId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/rating-summary")
    public RatingSummaryResponse getRatingSummary(@PathVariable Long movieId) {
        return ratingService.getRatingSummary(movieId);
    }
}
