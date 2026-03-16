# Movie Review Platform

Full-stack IMDb-style MVP built with Java + React.

## Tech Stack

- Frontend: React, Vite, Tailwind, Axios, React Router
- Backend: Spring Boot 4, Spring Security, Spring Data JPA, Flyway, JWT
- Database: MySQL 8 / Railway MySQL
- CI: GitHub Actions
- Test Infra: JUnit + MockMvc + Testcontainers

## Core Features

- User registration and login with JWT auth
- Public registration creates `USER` accounts only
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

## Local Setup

### Root environment

Create a root `.env` file (copy from `.env.example`).

Required values:

- `MYSQL_ROOT_PASSWORD`
- `APP_DB_USER`
- `APP_DB_PASSWORD`
- `JWT_SECRET` minimum 32 characters
- `JWT_EXPIRATION_MS`
- `JWT_REFRESH_EXPIRATION_MS`
- `CORS_ALLOWED_ORIGINS`

Optional values:

- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

### Docker quick start

```bash
cp .env.example .env
docker compose up --build
```

PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Access locally:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- MySQL: `localhost:3307`

### Run without Docker

Backend:

```powershell
cd backend/sample
.\mvnw.cmd spring-boot:run
```

Frontend `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Frontend run:

```powershell
cd frontend
npm ci
npm run dev
```

For verbose local SQL logs, run backend with:

```powershell
$env:SPRING_PROFILES_ACTIVE="dev"
.\mvnw.cmd spring-boot:run
```

## Database and Migrations

- Flyway migrations are in `backend/sample/src/main/resources/db/migration`
- Current baseline: `V1__init_schema.sql`
- Schema changes should be added as new migration files only
- Railway deployment uses `spring.flyway.baseline-on-migrate=true`

If you import an existing SQL dump into Railway and Flyway validation fails, drop the imported history table and redeploy:

```sql
DROP TABLE IF EXISTS flyway_schema_history;
```

## Railway Deployment

This repository has been deployed successfully on Railway with three services.

- Backend: Spring Boot service from `backend/sample`
- Frontend: Dockerfile-based Nginx service from `frontend`
- Database: Railway MySQL

### Backend Railway setup

Root directory:

- `backend/sample`

Required variables:

- `SPRING_DATASOURCE_URL=jdbc:mysql://mysql.railway.internal:3306/movie_platform?sslMode=DISABLED&allowPublicKeyRetrieval=true`
- `SPRING_DATASOURCE_USERNAME=<Railway MySQL username>`
- `SPRING_DATASOURCE_PASSWORD=<Railway MySQL password>`
- `JWT_SECRET=<minimum 32 character secret>`
- `JWT_EXPIRATION_MS=86400000`
- `JWT_REFRESH_EXPIRATION_MS=172800000`
- `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`

Important notes:

- Use `mysql.railway.internal` only inside Railway services.
- For MySQL Workbench or external import tools, use the public TCP proxy from the Railway MySQL Connect tab.
- Login token generation depends on a valid `JWT_SECRET`.

### Frontend Railway setup

Root directory:

- `frontend`

Deployment mode:

- Dockerfile

Required variable:

- `VITE_API_BASE_URL=https://<your-backend-domain>/api`

Networking:

- Generate a public domain
- Use port `80`

Important notes:

- The frontend does not proxy `/api` through Nginx.
- API requests go directly to the backend URL set in `VITE_API_BASE_URL`.
- Because Vite injects env values at build time, changing `VITE_API_BASE_URL` requires rebuild/redeploy.

### Railway MySQL data import

Recommended flow:

1. Create Railway MySQL service.
2. Use a public TCP proxy for Workbench access.
3. Create/select schema.
4. Import `movie_platform.sql` first.
5. Import `movie_platform_data.sql` second.
6. Configure backend to use internal Railway MySQL host.

## Troubleshooting

### CORS error in browser

Set backend variable exactly to the frontend origin:

- `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`

Do not add a trailing slash.

### Login returns `500`

Check:

- `JWT_SECRET` exists in Railway backend variables
- `JWT_SECRET` is at least 32 characters
- backend latest deployment includes JWT fixes

### Frontend URL returns `502`

Check:

- frontend service uses `frontend/Dockerfile`
- Railway public domain is mapped to port `80`
- `VITE_API_BASE_URL` points to live backend `/api`

### Flyway validation failed after importing SQL dump

Run:

```sql
DROP TABLE IF EXISTS flyway_schema_history;
```

Then redeploy backend.

### MySQL Workbench cannot connect

- `mysql.railway.internal` is private
- use Railway MySQL public proxy host/port for external tools

## Running Tests

Standard tests:

```powershell
cd backend/sample
.\mvnw.cmd test
```

Specific integration suites:

```powershell
.\mvnw.cmd -Dtest=AuthMovieIntegrationTests test
.\mvnw.cmd -Dtest=AuthRefreshReviewIntegrationTests test
```

## CI

Workflow: `.github/workflows/ci.yml`

- Backend: compile + tests
- Frontend: install + build
- Runs on push/PR to `main`/`master`

## Extra Docs

- API collection: `docs/POSTMAN_COLLECTION.json`
- Architecture overview: `docs/ARCHITECTURE.md`
- Free deployment guide: `docs/DEPLOYMENT_FREE.md`
- Release checklist: `docs/RELEASE_CHECKLIST.md`
- Production env template: `.env.production.example`
