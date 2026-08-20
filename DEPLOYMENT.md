# Deployment Checklist

## Required environment variables

Backend:

- `CORE_ENV=production`
- `DATABASE_URL` - production PostgreSQL connection URL.
- `SECRET_KEY` - a unique, high-entropy secret.
- `CORE_ALLOWED_ORIGINS` - the exact HTTPS frontend origin, for example `https://core.example.com`.
- `FIREBASE_SERVICE_ACCOUNT_JSON` - the Firebase Admin service-account JSON stored as a deployment secret.
- `CORE_ALLOW_DEV_PASSWORDLESS_LOGIN=false`

Frontend:

- `NEXT_PUBLIC_API_BASE_URL` - public HTTPS backend URL without `/api/v1`.
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`.

Do not configure `DATABASE_URL` in the frontend service.

## Release procedure

1. Rotate the database password and JWT secret that were previously present in repository utilities.
2. Install backend packages with `pip install -r requirements.txt`.
3. Run `python apply_migration.py` from `backend` once against the target database. It records completed migrations in `schema_migrations`; do not run it against a shared production database until it has been backed up.
4. Start the backend with `uvicorn src.main:app --host 0.0.0.0 --port $PORT`.
5. Build the frontend with `npm run build` and run it with `npm run start`.
6. Verify login, one request, one assignment, notification delivery, and role access after deployment.

## Production safeguards

- Production login uses Firebase ID tokens only; local passwordless login is disabled.
- Backend CORS accepts only the configured frontend origin.
- Schema creation and development sample-data seeding do not run in production.
- Run backend tests only with a disposable PostgreSQL database: `pip install -r requirements-dev.txt` then `pytest`.
