package com.sample.dto;

public record AuthResponse(
        String token,
        String refreshToken,
        String tokenType,
        Long userId,
        String name,
        String email,
        String role
) {
}
