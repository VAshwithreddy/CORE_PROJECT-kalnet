# Backend

This folder contains the CORE backend foundation. It is set up as a FastAPI app.

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn src.main:app --reload
```

Open:

```text
http://localhost:8000/health
http://localhost:8000/api/v1/health
http://localhost:8000/api/v1/setup-summary
http://localhost:8000/docs
```

Run backend tests:

```bash
python -m unittest
```

## Current structure

```text
backend/
  src/
    api/
      routes.py
    core/
      config.py
    schemas/
      health.py
    main.py
  .env.example
  requirements.txt
```

## What the backend setup currently provides

- FastAPI application entry point.
- CORS configuration for the frontend at `http://localhost:3000`.
- Health endpoint for checking that the backend runs.
- Setup summary endpoint for confirming the first CORE modules.

## First backend build target

Build APIs in this order:

1. Authentication and current-user endpoint.
2. Users, roles, departments, and permissions.
3. Work requests and routing.
4. Assignments and employee updates.
5. Blockers and escalations.
6. Approvals and decisions.
7. Audit logs.

Do not commit real passwords, API keys, access tokens, production database URLs, or real `.env` files.
