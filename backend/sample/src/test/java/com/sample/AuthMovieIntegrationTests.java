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
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.annotation.Transactional;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class AuthMovieIntegrationTests extends IntegrationTestBase {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Test
    void registerAndLoginShouldReturnJwtAndRefreshToken() throws Exception {
        String email = "user_" + System.nanoTime() + "@example.com";
        String registerBody = """
                {
                  "name": "User One",
                  "email": "%s",
                  "password": "Password@123",
                  "role": "USER"
                }
                """.formatted(email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("USER"));

        String loginBody = """
                {
                  "email": "%s",
                  "password": "Password@123"
                }
                """.formatted(email);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void adminCanCreateAndUpdateMovie() throws Exception {
        String adminToken = registerAndLogin("ADMIN");
        long genreId = createGenre(adminToken, "Sci-Fi-" + System.nanoTime());

        String createMovieBody = """
                {
                  "title": "Interstellar",
                  "description": "A sci-fi movie about space exploration and survival that pushes humanity to new frontiers.",
                  "releaseYear": 2014,
                  "posterUrl": "https://example.com/interstellar.jpg",
                  "trailerUrl": "https://www.youtube.com/watch?v=zSWdZVtXT7E",
                  "genreIds": [%d]
                }
                """.formatted(genreId);

        String createResponse = mockMvc.perform(post("/api/movies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createMovieBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Interstellar"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long movieId = objectMapper.readTree(createResponse).get("id").asLong();

        String updateMovieBody = """
                {
                  "title": "Interstellar (Updated)",
                  "description": "Updated description for interstellar movie record with enough detail for validation rules.",
                  "releaseYear": 2014,
                  "posterUrl": "https://example.com/interstellar-updated.jpg",
                  "trailerUrl": "https://www.youtube.com/watch?v=zSWdZVtXT7E",
                  "genreIds": [%d]
                }
                """.formatted(genreId);

        mockMvc.perform(put("/api/movies/{id}", movieId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateMovieBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(movieId))
                .andExpect(jsonPath("$.title").value("Interstellar (Updated)"));
    }

    @Test
    void userCannotCreateMovie() throws Exception {
        String userToken = registerAndLogin("USER");
        String createMovieBody = """
                {
                  "title": "Blocked Movie",
                  "description": "A valid description text for blocked movie creation by non-admin user.",
                  "releaseYear": 2020,
                  "genreIds": []
                }
                """;

        mockMvc.perform(post("/api/movies")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createMovieBody))
                .andExpect(status().isForbidden());
    }

    private String registerAndLogin(String role) throws Exception {
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
        return node.get("token").asText();
    }

    private long createGenre(String adminToken, String name) throws Exception {
        String genreBody = """
                {
                  "name": "%s"
                }
                """.formatted(name);

        String genreResponse = mockMvc.perform(post("/api/genres")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(genreBody))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(genreResponse).get("id").asLong();
    }
}
