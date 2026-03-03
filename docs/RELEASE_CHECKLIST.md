# Release Checklist

Use this before every production release.

## 1. Security and Secrets

- [ ] `.env` contains strong secrets (no defaults).
- [ ] `JWT_SECRET` is rotated/updated if previously exposed.
- [ ] `CORS_ALLOWED_ORIGINS` includes only real frontend domains.
- [ ] No secrets are committed to Git (`git status`, `git diff` verify).

## 2. Database

- [ ] Flyway migration scripts are added for schema changes.
- [ ] Migration tested on staging DB.
- [ ] Backup strategy is ready (snapshot/dump before deploy).

## 3. Backend Validation

- [ ] Backend unit/integration tests pass:
  - `./mvnw test`
- [ ] Critical endpoints manually verified:
  - auth register/login/refresh
  - movie CRUD (admin)
  - review/rating flows

## 4. Frontend Validation

- [ ] Frontend build passes:
  - `npm ci && npm run build`
- [ ] Production API URL is correct (`VITE_API_BASE_URL`).
- [ ] Auth flow works end-to-end with production backend.

## 5. CI/CD

- [ ] GitHub Actions CI passed on target commit/PR.
- [ ] Only reviewed and intended files are included in release.

## 6. Deployment

- [ ] Deploy backend and database first.
- [ ] Run smoke checks on backend:
  - `GET /api/hello`
  - auth and one protected endpoint
- [ ] Deploy frontend with correct env vars.
- [ ] Verify browser app: login, list movies, details, admin actions.

## 7. Post-Deploy Monitoring

- [ ] Check backend logs for auth/db/migration errors.
- [ ] Confirm no CORS errors in browser console.
- [ ] Confirm token refresh flow works after access token expiry.
- [ ] Confirm DB health and connection pool stability.

## 8. Rollback Plan

- [ ] Previous stable image/tag is available.
- [ ] Clear rollback command is prepared.
- [ ] Data rollback process is documented if migration fails.

