# Free Deployment Guide (Beginner Friendly)

This guide focuses on lowest-friction options with free entry tiers.

## Recommended Path

Use:
- Railway: backend + MySQL
- Render Static Site (or Vercel): frontend

Reason:
- Your backend already uses MySQL.
- Frontend static hosting is easy and cheap/free on multiple platforms.

## Option A: Railway for Backend + MySQL

### 1. Create Railway project

- Create a new project from GitHub repo.
- Add two services:
  - MySQL
  - Backend (from `backend/sample`)

### 2. Backend service settings

- Build command:
  - `./mvnw -DskipTests package`
- Start command:
  - `java -jar target/*.jar`

### 3. Backend environment variables

Set these in Railway backend service:

- `SPRING_DATASOURCE_URL` = MySQL connection URL from Railway MySQL service
- `SPRING_DATASOURCE_USERNAME` = MySQL username
- `SQL_PASS` = MySQL password
- `JWT_SECRET` = strong Base64 secret
- `JWT_EXPIRATION_MS` = `86400000`
- `JWT_REFRESH_EXPIRATION_MS` = `172800000`
- `CORS_ALLOWED_ORIGINS` = frontend production URL (example `https://your-frontend.onrender.com`)

### 4. Deploy backend

- Trigger deploy.
- Verify API works at:
  - `https://your-backend-domain/api/hello`

## Option B: Render Static Site for Frontend

### 1. Create Static Site on Render

- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`

### 2. Frontend environment variables

- `VITE_API_BASE_URL` = `https://your-backend-domain/api`
- `VITE_CLOUDINARY_CLOUD_NAME` = optional
- `VITE_CLOUDINARY_UPLOAD_PRESET` = optional

### 3. Deploy frontend

- Open deployed URL and test login/movie listing.

## Mandatory Checks Before Going Live

1. Use non-default JWT secret.
2. Set `CORS_ALLOWED_ORIGINS` to actual frontend domain only.
3. Ensure backend responds over HTTPS.
4. Verify Flyway migration ran successfully.
5. Create at least one admin user.

## Admin Bootstrap (First Admin User)

Use register API once with ADMIN role:

```bash
curl -X POST https://your-backend-domain/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Admin",
    "email":"admin@example.com",
    "password":"Password@123",
    "role":"ADMIN"
  }'
```

After first admin creation, use normal login flow.

## Notes

- Free tiers can sleep after inactivity and cold-start on first request.
- If your free tier blocks MySQL usage or uptime needs increase, move DB to paid managed MySQL.

