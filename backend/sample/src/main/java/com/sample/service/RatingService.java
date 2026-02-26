package com.sample.service;

import com.sample.dto.RatingRequest;
import com.sample.dto.RatingResponse;
import com.sample.dto.RatingSummaryResponse;
import com.sample.entity.Movie;
import com.sample.entity.Rating;
import com.sample.entity.User;
import com.sample.repository.MovieRepository;
import com.sample.repository.RatingRepository;
import com.sample.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RatingService {

    private final RatingRepository ratingRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    public RatingService(RatingRepository ratingRepository, MovieRepository movieRepository, UserRepository userRepository) {
        this.ratingRepository = ratingRepository;
        this.movieRepository = movieRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RatingResponse upsertRating(Long movieId, String userEmail, RatingRequest request) {
        User user = getUserByEmailOrThrow(userEmail);
        Movie movie = getActiveMovieOrThrow(movieId);

        Rating rating = ratingRepository.findByMovieIdAndUserId(movieId, user.getId())
                .orElseGet(Rating::new);

        if (rating.getId() == null) {
            rating.setMovie(movie);
            rating.setUser(user);
        }

        rating.setScore(request.getScore());
        Rating saved = ratingRepository.save(rating);
        return toResponse(saved);
    }

    @Transactional
    public void deleteMyRating(Long movieId, String userEmail) {
        User user = getUserByEmailOrThrow(userEmail);
        Rating rating = ratingRepository.findByMovieIdAndUserId(movieId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rating not found"));
        ratingRepository.delete(rating);
    }
  
    @Transactional(readOnly = true)
    public RatingSummaryResponse getRatingSummary(Long movieId) {
        getActiveMovieOrThrow(movieId);
        double average = ratingRepository.getAverageScoreByMovieId(movieId);
        long total = ratingRepository.countByMovieId(movieId);
        return new RatingSummaryResponse(movieId, average, total);
    }

    private User getUserByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Movie getActiveMovieOrThrow(Long movieId) {
        return movieRepository.findByIdAndIsDeletedFalse(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
    }

    private RatingResponse toResponse(Rating rating) {
        return new RatingResponse(
                rating.getId(),
                rating.getMovie().getId(),
                rating.getUser().getId(),
                rating.getUser().getName(),
                rating.getScore(),
                rating.getUpdatedAt()
        );
    }
}
