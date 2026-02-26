package com.sample.dto;

import java.time.LocalDateTime;
import java.util.Set;

public record MovieResponse(
        Long id,
        String title,
        String description,
        Integer releaseYear,
        Set<String> genres,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}