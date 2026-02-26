package com.sample.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GenreRequest {

    @NotBlank(message = "Genre name is required")
    @Size(min = 2, max = 100, message = "Genre name must be between 2 and 100 characters")
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}