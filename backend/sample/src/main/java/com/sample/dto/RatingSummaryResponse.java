package com.sample.dto;

public record RatingSummaryResponse(
        Long movieId,
        double averageScore,
        long totalRatings
) {
}
