# Architecture and Request Flow

## High-Level Architecture

```mermaid
flowchart LR
    U[User Browser] --> F[React Frontend]
    F -->|HTTP /api| B[Spring Boot Backend]
    B --> J[Spring Security + JWT Filter]
    B --> S[Service Layer]
    S --> R[Repository Layer]
    R --> D[(MySQL)]
    B --> M[Flyway Migration]
    M --> D
```

## Backend Layering

- Controller layer:
  - Receives HTTP requests and validates DTOs.
  - Uses authenticated principal from Spring Security.
- Service layer:
  - Applies business rules (ownership, role checks, soft-delete logic).
  - Coordinates entity mapping and repository calls.
- Repository layer:
  - Executes database queries via Spring Data JPA.
- Database layer:
  - MySQL schema managed by Flyway migrations.

## Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as AuthController
    participant AS as AuthService
    participant J as JwtService
    participant U as UserRepository

    C->>A: POST /api/auth/login
    A->>AS: login(request)
    AS->>U: find user + verify credentials
    AS->>J: generate access + refresh tokens
    AS-->>A: AuthResponse(token, refreshToken)
    A-->>C: 200 OK
```

### Access Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant F as JwtAuthenticationFilter
    participant S as SecurityContext
    participant API as Protected Endpoint

    C->>F: Request with Authorization: Bearer accessToken
    F->>F: extract username + validate token type/access + expiry
    F->>S: set authenticated user
    S-->>API: Authentication available
    API-->>C: Response
```

### Refresh Token Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as AuthController
    participant AS as AuthService
    participant J as JwtService

    C->>A: POST /api/auth/refresh
    A->>AS: refresh(refreshToken)
    AS->>J: validate refresh token
    AS->>J: issue new access + refresh tokens
    A-->>C: 200 with rotated tokens
```

## Movie and Genre Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant MC as MovieController
    participant MS as MovieService
    participant GR as GenreRepository
    participant MR as MovieRepository
    participant DB as MySQL

    C->>MC: POST /api/movies (ADMIN)
    MC->>MS: createMovie(request)
    MS->>GR: findByIdIn(genreIds)
    MS->>MR: save(movie)
    MR->>DB: INSERT movie + movie_genres
    MC-->>C: 201 MovieResponse
```

## Review Ownership Rules

- `USER` can create/update/delete only their own review.
- `ADMIN` can delete any review.
- Attempt to update another user's review returns `403`.

## Rating Rules

- One rating per user per movie.
- `PUT /movies/{id}/rating` inserts or updates existing rating.
- `DELETE /movies/{id}/rating` removes current user's rating.

## Pagination

- Movies: `GET /api/movies?page=&size=&search=&genreId=`
- Reviews: `GET /api/movies/{movieId}/reviews?page=&size=`

## Deployment Topology (Docker Compose)

```mermaid
flowchart LR
    N[Nginx in Frontend Container] -->|/api proxy| B[Backend Container:8080]
    N -->|static files| UI[React Build]
    B --> DB[(MySQL Container)]
```

## Security Notes

- JWT secret and DB credentials come from environment variables.
- CORS origins are environment-driven (`CORS_ALLOWED_ORIGINS`).
- In production, set only trusted frontend domain(s).

