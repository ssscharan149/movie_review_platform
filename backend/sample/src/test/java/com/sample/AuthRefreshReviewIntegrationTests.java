package com.sample;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class AuthRefreshReviewIntegrationTests extends IntegrationTestBase {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Test
    void refreshWithValidRefreshTokenShouldReturnNewTokens() throws Exception {
        AuthTokens tokens = registerAndLogin("USER");

        String refreshBody = """
                {
                  "refreshToken": "%s"
                }
                """.formatted(tokens.refreshToken());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void refreshWithInvalidTokenShouldReturnUnauthorized() throws Exception {
        String refreshBody = """
                {
                  "refreshToken": "invalid-refresh-token"
                }
                """;

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshBody))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userCannotUpdateAnotherUsersReview() throws Exception {
        AuthTokens admin = registerAndLogin("ADMIN");
        AuthTokens firstUser = registerAndLogin("USER");
        AuthTokens secondUser = registerAndLogin("USER");

        long genreId = createGenre(admin.token(), "Drama-" + System.nanoTime());
        long movieId = createMovie(admin.token(), genreId, "Review Auth Movie");
        long reviewId = createReview(firstUser.token(), movieId, "This is a detailed first review that satisfies minimum length.");

        String updateBody = """
                {
                  "content": "Second user is trying to update someone else's review with enough length."
                }
                """;

        mockMvc.perform(put("/api/reviews/{reviewId}", reviewId)
                        .header("Authorization", "Bearer " + secondUser.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanDeleteAnotherUsersReview() throws Exception {
        AuthTokens admin = registerAndLogin("ADMIN");
        AuthTokens user = registerAndLogin("USER");

        long genreId = createGenre(admin.token(), "Action-" + System.nanoTime());
        long movieId = createMovie(admin.token(), genreId, "Delete Review Movie");
        long reviewId = createReview(user.token(), movieId, "A valid user review text that will be deleted by admin.");

        mockMvc.perform(delete("/api/reviews/{reviewId}", reviewId)
                        .header("Authorization", "Bearer " + admin.token()))
                .andExpect(status().isNoContent());
    }

    private AuthTokens registerAndLogin(String role) throws Exception {
        String email = role.toLowerCase() + "_" + System.nanoTime() + "@example.com";
        String registerBody = """
                {
                  "name": "%s User",
                  "email": "%s",
                  "password": "Password@123",
                  "role": "%s"
                }
                """.formatted(role, email, role);

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode node = objectMapper.readTree(registerResponse);
        return new AuthTokens(node.get("token").asText(), node.get("refreshToken").asText(), email);
    }

    private long createGenre(String adminToken, String genreName) throws Exception {
        String genreBody = """
                {
                  "name": "%s"
                }
                """.formatted(genreName);

        String response = mockMvc.perform(post("/api/genres")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(genreBody))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private long createMovie(String adminToken, long genreId, String title) throws Exception {
        String createMovieBody = """
                {
                  "title": "%s",
                  "description": "A sufficiently descriptive movie content for integration test coverage path.",
                  "releaseYear": 2022,
                  "posterUrl": "https://example.com/poster.jpg",
                  "trailerUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                  "genreIds": [%d]
                }
                """.formatted(title, genreId);

        String response = mockMvc.perform(post("/api/movies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createMovieBody))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private long createReview(String userToken, long movieId, String content) throws Exception {
        String reviewBody = """
                {
                  "content": "%s"
                }
                """.formatted(content);

        String response = mockMvc.perform(post("/api/movies/{movieId}/reviews", movieId)
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewBody))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private record AuthTokens(String token, String refreshToken, String email) {
    }
}

