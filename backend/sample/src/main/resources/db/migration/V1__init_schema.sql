CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
);

CREATE TABLE genres (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_genres_name (name)
);

CREATE TABLE movies (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    release_year INT NOT NULL,
    poster_url VARCHAR(1000) NULL,
    trailer_url VARCHAR(1000) NULL,
    is_deleted BIT(1) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_movies_deleted_title (is_deleted, title)
);

CREATE TABLE movie_genres (
    movie_id BIGINT NOT NULL,
    genre_id BIGINT NOT NULL,
    PRIMARY KEY (movie_id, genre_id),
    CONSTRAINT fk_movie_genres_movie FOREIGN KEY (movie_id) REFERENCES movies (id),
    CONSTRAINT fk_movie_genres_genre FOREIGN KEY (genre_id) REFERENCES genres (id)
);

CREATE TABLE ratings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    movie_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    score INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ratings_movie_user (movie_id, user_id),
    KEY idx_ratings_movie_id (movie_id),
    KEY idx_ratings_user_id (user_id),
    CONSTRAINT fk_ratings_movie FOREIGN KEY (movie_id) REFERENCES movies (id),
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    movie_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content VARCHAR(2000) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_reviews_movie_user (movie_id, user_id),
    KEY idx_reviews_movie_id (movie_id),
    KEY idx_reviews_user_id (user_id),
    CONSTRAINT fk_reviews_movie FOREIGN KEY (movie_id) REFERENCES movies (id),
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id)
);

