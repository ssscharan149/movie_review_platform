# Movie Review Platform

Java full-stack project with:
- Backend: Spring Boot + Spring Security + JPA + Flyway + MySQL
- Frontend: React + Vite + Tailwind

## Quick Run With Docker (Recommended for Cloners)

1. Copy env file:
```bash
cp .env.example .env
```
On Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

2. Start all services:
```bash
docker compose up --build
```

3. Open app:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- MySQL (from host): `localhost:3307`

4. Stop services:
```bash
docker compose down
```

To also remove DB volume:
```bash
docker compose down -v
```

## Mandatory Before Hosting

1. Replace demo JWT secret in `.env` with a strong secret.
2. Use strong DB credentials (not defaults).
3. Configure production CORS origins (frontend domain only).
4. Use HTTPS (TLS) on public domain.
5. Keep Flyway migrations as the only schema change path.
6. Turn down verbose SQL logs for production.
7. Ensure CI is green before deploy.

## Hosting Path (Simple)

1. Choose a VM provider (AWS EC2, Azure VM, DigitalOcean, Render VM).
2. Install Docker + Docker Compose on server.
3. Clone repo on server and create `.env`.
4. Run:
```bash
docker compose up -d --build
```
5. Put Nginx/Caddy reverse proxy in front for TLS + domain mapping.
6. Point DNS to server IP.

## Notes

- Integration tests use Testcontainers and require Docker.
- CI workflow is in `.github/workflows/ci.yml`.

