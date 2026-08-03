# Team Setup and Workflow

This guide explains how this repository is arranged, how the first architecture was created, and how the team should continue working.

## What was created

The repository now has two main folders:

```text
frontend/
backend/
```

The frontend is now a Next.js and TypeScript setup with the route architecture inside:

```text
frontend/src/
```

The backend is now a FastAPI setup inside:

```text
backend/src/
```

The main frontend sections are:

```text
frontend/src/app/
frontend/src/components/
frontend/src/features/
frontend/src/lib/
```

## How this architecture was created

The process was:

1. Clone the GitHub repository to the computer.
2. Create `frontend/` and `backend/` at the root of the project.
3. Create the route folders from the reference image inside `frontend/src/app/`.
4. Create shared UI folders inside `frontend/src/components/`.
5. Create feature folders inside `frontend/src/features/`.
6. Create shared helper files inside `frontend/src/lib/`.
7. Add `.gitkeep` files in empty folders so Git can save those folders.
8. Check the changes using `git status`.
9. Commit the setup using Git.

Git does not track empty folders by default. That is why `.gitkeep` files were added. When a folder later contains real code, the `.gitkeep` file can stay or be removed.

## What frontend and backend setup now means

Frontend setup means the user-facing app can run locally and has a place for pages, layouts, shared UI components, design tokens, API calls, auth helpers, route rules, and feature logic.

Backend setup means the server can run locally and has a place for API routes, configuration, schemas, services, database logic, authentication, and future AIML integration.

The setup checkpoint is:

```text
Frontend runs on http://localhost:3000
Backend responds on http://localhost:8000/health
Frontend can be configured to call the backend through NEXT_PUBLIC_API_BASE_URL
```

## Running the project locally

Frontend:

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn src.main:app --reload
```

Open these URLs:

```text
Frontend: http://localhost:3000
Backend health: http://localhost:8000/health
Backend docs: http://localhost:8000/docs
```

## How teammates should get access

The repository owner should add teammates on GitHub:

```text
GitHub repository -> Settings -> Collaborators and teams -> Add people
```

After accepting the invite, each teammate can clone the project:

```bash
git clone https://github.com/VAshwithreddy/CORE_PROJECT-kalnet.git
cd CORE_PROJECT-kalnet
```

## Daily team workflow

Before starting work:

```bash
git pull origin main
git checkout -b feature/your-task-name
```

After completing work:

```bash
git status
git add .
git commit -m "Describe your change"
git push origin feature/your-task-name
```

Then open a pull request on GitHub.

## How to add a new folder later

Example: adding an employee calendar route.

```bash
mkdir frontend/src/app/employee/calendar
New-Item frontend/src/app/employee/calendar/.gitkeep
git status
git add .
git commit -m "Add employee calendar route"
git push origin feature/employee-calendar
```

When implementation starts, add the real page file:

```text
frontend/src/app/employee/calendar/page.tsx
```

## How to add a new file later

Example: adding a reusable status badge component.

```text
frontend/src/components/status-badge/index.tsx
```

Then save it to Git:

```bash
git status
git add frontend/src/components/status-badge/index.tsx
git commit -m "Add status badge component"
git push origin feature/status-badge
```

## Recommended next steps

1. Push the current local setup branch to GitHub.
2. Add teammates as collaborators.
3. Ask every teammate to run frontend and backend locally.
4. Assign one small MVP task per teammate.
5. Build the first flow: login -> intake -> routing -> assignment -> employee update -> blocker -> audit.
6. Use pull requests for review before merging into `main`.

## Important safety rule

Never commit passwords, API keys, access tokens, or real `.env` files. Use `.env.example` for sample environment variable names only.
