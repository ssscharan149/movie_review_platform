# Movie Review Platform

Full-stack IMDb-style MVP built with Java + React.

## Tech Stack

- Frontend: React, Vite, Tailwind, Axios, React Router
- Backend: Spring Boot 4, Spring Security, Spring Data JPA, Flyway, JWT
- Database: MySQL 8
- CI: GitHub Actions
- Test Infra: JUnit + MockMvc + Testcontainers

## Core Features

- User registration and login with JWT auth
- Access token + refresh token flow
- Role-based authorization (`USER`, `ADMIN`)
- Browse movies with pagination
- Movie detail with ratings and reviews
- Review add/edit/delete with ownership rules
- Admin movie create/update/delete
- Admin genre create/update/delete
- Poster and trailer URL support
- Light/Dark theme UI

## Project Structure

- `backend/sample`: Spring Boot API
- `frontend`: React app
- `docker-compose.yml`: full app stack (db + backend + frontend)
- `.github/workflows/ci.yml`: CI pipeline

## Configuration Needed (Mandatory)

Create a root `.env` file (copy from `.env.example`).

### Required values

- `MYSQL_ROOT_PASSWORD`: MySQL root password
- `APP_DB_USER`: App DB username
- `APP_DB_PASSWORD`: App DB password
- `JWT_SECRET`: Base64 secret for JWT signing (strong secret required)
- `JWT_EXPIRATION_MS`: access token lifetime in ms
- `JWT_REFRESH_EXPIRATION_MS`: refresh token lifetime in ms
- `CORS_ALLOWED_ORIGINS`: comma-separated frontend origins (example `http://localhost:3000,http://localhost:5173`)

### Optional values

- `VITE_CLOUDINARY_CLOUD_NAME`: for poster upload in admin UI
- `VITE_CLOUDINARY_UPLOAD_PRESET`: unsigned upload preset

## Quick Start (Docker Recommended)

### 1. Prepare env

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

### 2. Start full stack

```bash
docker compose up --build
```

### 3. Access services

- Frontend: `http://localhost:3000`
- Backend API base: `http://localhost:8080/api`
- MySQL host port: `localhost:3307`

### 4. Stop stack

```bash
docker compose down
```

Remove DB volume too:

```bash
docker compose down -v
```

## Local Run (Without Docker)

### Backend

1. Create env vars in your shell:
- `SQL_PASS`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS` (optional)
- `JWT_REFRESH_EXPIRATION_MS` (optional)

2. Start backend:

```powershell
cd backend/sample
.\mvnw.cmd spring-boot:run
```

### Frontend

1. Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

2. Start frontend:

```powershell
cd frontend
npm ci
npm run dev
```

## Database and Migrations

- Flyway migrations are in `backend/sample/src/main/resources/db/migration`
- Current baseline: `V1__init_schema.sql`
- Schema changes should be added as new migration files only

## Running Tests

### Standard tests

```powershell
cd backend/sample
.\mvnw.cmd test
```

### Integration tests with Testcontainers

Docker must be running. On Windows, if needed:

```powershell
$env:DOCKER_HOST="tcp://localhost:2375"
```

Run specific suites:

```powershell
.\mvnw.cmd -Dtest=AuthMovieIntegrationTests test
.\mvnw.cmd -Dtest=AuthRefreshReviewIntegrationTests test
```

## CI

Workflow: `.github/workflows/ci.yml`

- Backend: compile + tests
- Frontend: install + build
- Runs on push/PR to `main`/`master`

## Hosting Checklist (Mandatory Before Production)

1. Use strong secrets and passwords (never commit real secrets).
2. Configure CORS to real frontend domain only.
3. Use HTTPS with reverse proxy (Nginx/Caddy/Traefik).
4. Reduce verbose SQL logging in production.
5. Keep `ddl-auto=none`; use Flyway migrations only.
6. Ensure CI is green before deploy.
7. Add backups for MySQL volume.

## Basic Deployment Path

1. Provision VM (AWS/Azure/DigitalOcean/etc.).
2. Install Docker + Docker Compose.
3. Clone repo and set `.env`.
4. Run:

```bash
docker compose up -d --build
```

5. Configure domain + TLS on reverse proxy.

## Extra Docs

- API collection: `docs/POSTMAN_COLLECTION.json`
- Architecture overview: `docs/ARCHITECTURE.md`
- Free deployment guide: `docs/DEPLOYMENT_FREE.md`
- Release checklist: `docs/RELEASE_CHECKLIST.md`
- Production env template: `.env.production.example`
