# Frontend

React + Vite frontend for the Movie Review Platform.

## Stack

- React 19
- Vite 7
- Tailwind CSS 4
- Axios
- React Router
- Nginx for production container serving

## Local Development

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Run locally:

```powershell
cd frontend
npm ci
npm run dev
```

Default local dev URL:

- `http://localhost:5173`

## Production Build

Build locally:

```powershell
cd frontend
npm ci
npm run build
```

## Railway Deployment

This frontend is deployed on Railway using the Dockerfile in this folder.

### Railway service configuration

- Root directory: `frontend`
- Builder: Dockerfile
- Public domain port: `80`

Required Railway variable:

- `VITE_API_BASE_URL=https://<your-backend-domain>/api`

### Important behavior

- The built frontend does not proxy `/api` requests through Nginx.
- API requests go directly to the deployed backend using `VITE_API_BASE_URL`.
- Because Vite injects env values at build time, changing `VITE_API_BASE_URL` requires a rebuild/redeploy.

## Auth UX

- Login/register form includes a show/hide password toggle.
- Auth tokens are stored in localStorage.
- Refresh token flow is handled through Axios interceptors.

## Troubleshooting

### Frontend shows CORS error in browser console

Set backend Railway variable:

- `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`

### Frontend loads but API calls fail

Check:

- `VITE_API_BASE_URL` is correct
- backend service is live
- backend public domain includes `/api`

### Railway public URL returns `502`

Check:

- public domain is mapped to port `80`
- latest frontend Docker image is deployed
- backend CORS is configured correctly

### Login form returns server error

This is usually a backend issue. Check backend variables:

- `JWT_SECRET`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
