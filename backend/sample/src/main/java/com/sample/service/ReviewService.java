package com.sample.service;

import com.sample.dto.ReviewRequest;
import com.sample.dto.ReviewResponse;
import com.sample.entity.Movie;
import com.sample.entity.Review;
import com.sample.entity.Role;
import com.sample.entity.User;
import com.sample.repository.MovieRepository;
import com.sample.repository.ReviewRepository;
import com.sample.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, MovieRepository movieRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.movieRepository = movieRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReviewResponse createReview(Long movieId, String userEmail, ReviewRequest request) {
        User user = getUserByEmailOrThrow(userEmail);
        Movie movie = getActiveMovieOrThrow(movieId);

        if (reviewRepository.findByMovieIdAndUserId(movieId, user.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already reviewed this movie");
        }

        Review review = new Review();
        review.setMovie(movie);
        review.setUser(user);
        review.setContent(request.getContent().trim());
        Review saved = reviewRepository.save(review);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getMovieReviews(Long movieId, Pageable pageable) {
        getActiveMovieOrThrow(movieId);
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId, pageable).map(this::toResponse);
    }

    @Transactional
    public ReviewResponse updateMyReview(Long reviewId, String userEmail, ReviewRequest request) {
        User user = getUserByEmailOrThrow(userEmail);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own review");
        }

        review.setContent(request.getContent().trim());
        Review saved = reviewRepository.save(review);
        return toResponse(saved);
    }

    @Transactional
    public void deleteReview(Long reviewId, String userEmail) {
        User user = getUserByEmailOrThrow(userEmail);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        boolean isOwner = review.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own review");
        }

        reviewRepository.delete(review);
    }

    private User getUserByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Movie getActiveMovieOrThrow(Long movieId) {
        return movieRepository.findByIdAndIsDeletedFalse(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getMovie().getId(),
                review.getUser().getId(),
                review.getUser().getName(),
                review.getContent(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
