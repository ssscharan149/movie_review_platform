package com.sample.dto;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long movieId,
        Long userId,
        String userName,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
