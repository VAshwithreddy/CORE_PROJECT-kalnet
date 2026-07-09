# CORE_PROJECT-kalnet

This repository is the shared workspace for the CORE project.

## Project folders

```text
CORE_PROJECT-kalnet/
  frontend/   Frontend application architecture and UI code
  backend/    Backend API, services, database, and server-side code
```

The first frontend architecture has been created from the reference image under:

```text
frontend/src/
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
