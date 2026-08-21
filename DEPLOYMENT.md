# Deployment: Render backend + Vercel frontend

This project deploys as two services:

- **Render** runs the FastAPI backend from `backend`.
- **Vercel** runs the Next.js frontend from `frontend`.

The repository includes `render.yaml` for the Render service settings. It
deliberately contains no passwords, API keys, or Firebase private keys.

## Before you begin

1. Push the repository to a private GitHub repository. Confirm that `.env`,
   `.env.local`, and your Firebase service-account JSON file are not tracked.
2. Rotate every credential that was previously shared outside a secret manager:
   database password, JWT secret, Firebase service account/private key, and AI
   provider key.
3. Back up the Supabase database before applying migrations.

## Part 1: Deploy the backend on Render

1. In Render, select **New > Blueprint** and connect the GitHub repository.
   Render reads `render.yaml` and creates a `core-api` web service.
2. Open the service's **Environment** page and set these values. Do not add
   quotation marks around ordinary values.

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | Your Supabase PostgreSQL connection string. |
   | `CORE_ALLOWED_ORIGINS` | Set `https://placeholder.invalid` for the first deploy; replace it with the exact Vercel URL in Part 2, then redeploy. |
   | `FIREBASE_SERVICE_ACCOUNT_FILE` | `/etc/secrets/firebase-service-account.json` after completing the secret-file step below. |
   | `AI_API_KEY` | Optional. Leave blank while `AI_ENABLED=false`. |

   Still on the **Environment** page, under **Secret Files**, click **Add Secret
   File**. Use the filename `firebase-service-account.json` and paste the full
   contents of your Firebase JSON file. Render mounts it at
   `/etc/secrets/firebase-service-account.json`; the backend reads it through
   `FIREBASE_SERVICE_ACCOUNT_FILE`. Do not add this file to Git or paste its
   contents into a public setting.

   Render generates `SECRET_KEY`; do not replace it with a value from local
   development. Keep `CORE_ENV=production` and
   `CORE_ALLOW_DEV_PASSWORDLESS_LOGIN=false` as declared in `render.yaml`.
3. Deploy the service. The health check must report success at:

   ```text
   https://YOUR-RENDER-SERVICE.onrender.com/api/v1/health
   ```

4. From your computer, run the database migrations once against the backed-up
   production database:

   ```powershell
   cd backend
   .\.venv\Scripts\python.exe apply_migration.py
   ```

   Do not run the test suite against this database: the backend tests truncate
   tables and require a disposable test database.

## Part 2: Deploy the frontend on Vercel

1. In Vercel, select **Add New > Project**, import the same GitHub repository,
   and set **Root Directory** to `frontend`.
2. Keep the detected Next.js build settings:

   | Setting | Value |
   | --- | --- |
   | Framework Preset | Next.js |
   | Build Command | `npm run build` |
   | Install Command | `npm install` |
3. Under **Settings > Environment Variables**, add the following for the
   **Production** environment before the first deployment:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_BASE_URL` | Your Render URL, for example `https://YOUR-RENDER-SERVICE.onrender.com` (no trailing `/api/v1`). |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app API key. |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain. |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID. |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket. |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID. |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID. |
   | `NEXT_PUBLIC_AI_DIGEST` | Optional hosted AI Digest endpoint. |
   | `DATABASE_URL` | Required by the existing server-side Executive Reports route. Do **not** prefix it with `NEXT_PUBLIC_`. |

   The `NEXT_PUBLIC_*` values are embedded at build time, so redeploy after
   changing any of them.
4. Deploy. Copy the resulting production URL, such as
   `https://your-project.vercel.app`.

## Part 3: Connect the two deployments

1. In Render, set `CORE_ALLOWED_ORIGINS` to the exact Vercel production URL,
   without a trailing slash, and redeploy the backend.
2. In Firebase Console > Authentication > Settings > Authorized domains, add
   your Vercel production domain. Enable the Email/Password and Google providers
   you intend to offer.
3. If you attach a custom domain later, add that exact domain to both Firebase
   Authorized domains and `CORE_ALLOWED_ORIGINS`. Update Vercel variables and
   redeploy.

## Production verification

1. Open the Vercel URL and sign in with a Firebase user whose verified email
   matches a record in the `people` table.
2. Confirm a protected page can load data from the Render API.
3. Confirm the browser Network panel shows no CORS errors.
4. Create one request, update one assignment, and confirm the audit page records
   the action.
5. Visit the Render health URL again. It should return `{"status":"ok",...}`.

## Important security rules

- Never commit `.env`, `.env.local`, a service-account JSON file, or a database
  URL to Git.
- Firebase web configuration can be public; the Firebase **service-account JSON
  private key must never be public**.
- Keep `DATABASE_URL` server-only. The existing Vercel Route Handler uses it for
  Executive Reports, so it is a Vercel secret, not a browser variable.
- Production login uses Firebase ID tokens only. Local passwordless login must
  remain disabled in production.
