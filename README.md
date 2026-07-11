# CORE_PROJECT-kalnet

This repository is the shared workspace for the CORE project.

CORE is being built as a role-based work management platform for:

- work intake
- routing
- assignments
- blockers
- approvals
- audit history
- reporting and digest generation

## Project folders

```text
CORE_PROJECT-kalnet/
  frontend/   Next.js frontend application and UI architecture
  backend/    FastAPI backend foundation, API routes, and server-side code
  docs/       Team workflow and planning documents
```

The frontend architecture has been created under:

```text
frontend/src/
```

The backend health API has been created under:

```text
backend/src/
```

## Current setup status

The project now has a basic runnable foundation:

- Frontend package setup with Next.js, TypeScript, global styles, and starter role pages.
- Backend FastAPI setup with health and setup-summary endpoints.
- Environment examples for both frontend and backend.
- Design tokens and frontend documentation for consistent UI work.

This is still the setup stage, not the final product. The next development target should be the MVP workflow:

```text
login
-> work intake
-> routing
-> assignment creation
-> employee progress update
-> blocker tracking
-> audit history
```

## Run the frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Run the backend

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
http://localhost:8000/api/v1/setup-summary
```

## How the team should work

1. Add every teammate to the GitHub repository:
   GitHub repo -> Settings -> Collaborators and teams -> Add people.
2. Each teammate clones the repository:

```bash
git clone https://github.com/VAshwithreddy/CORE_PROJECT-kalnet.git
cd CORE_PROJECT-kalnet
```

3. Before starting work, get the newest code:

```bash
git pull origin main
```

4. Create a branch for the task:

```bash
git checkout -b feature/task-name
```

5. After making changes, save them to Git:

```bash
git status
git add .
git commit -m "Add task description"
git push origin feature/task-name
```

6. Open a pull request on GitHub so the team can review and merge.

## Adding future improvements

When you want to add more folders or files later:

1. Create the folder or file in the correct place.
2. If the folder is empty, add a `.gitkeep` file inside it so Git can track it.
3. Run `git status` to check what changed.
4. Run `git add .`, `git commit -m "Your message"`, and `git push`.

Use `frontend/README.md` for frontend-specific guidance.
Use `backend/README.md` for backend-specific guidance.
