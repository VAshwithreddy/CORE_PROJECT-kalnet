# Contributing

This project should use a simple team workflow.

## Recommended branch names

```text
feature/frontend-login
feature/backend-auth
fix/navbar-layout
docs/project-setup
```

## Daily workflow

```bash
git pull origin main
git checkout -b feature/your-task-name
```

After finishing a task:

```bash
git status
git add .
git commit -m "Describe your change"
git push origin feature/your-task-name
```

Then create a pull request on GitHub.

## Team rules

- Pull the newest code before starting work.
- Work in small branches.
- Keep frontend work inside `frontend/`.
- Keep backend work inside `backend/`.
- Do not commit passwords, API keys, or `.env` files.
- Use clear commit messages so teammates can understand the history.
