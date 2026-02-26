package com.sample.dto;

import java.time.LocalDateTime;

public record RatingResponse(
        Long id,
        Long movieId,
        Long userId,
        String userName,
        Integer score,
        LocalDateTime updatedAt
) {
}
