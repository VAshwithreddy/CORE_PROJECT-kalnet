# CORE Management Platform - Frontend Demo Script

This script is designed for presenting the current state of the CORE Management Platform frontend to the team or stakeholders. It highlights the new robust UI architecture, the multi-persona entry flow, real local state mutations, and the access control system.

## Setup Before the Demo
1. Ensure you have run `npm install` and `npm run dev` in the `frontend` directory.
2. Open `http://localhost:3000` in your browser.
3. If you have old state, clear your browser's Local Storage or click the **"Clear State"** option in the Role Switcher if available, then refresh to start fresh.

---

## 🎬 Part 1: The Persona Landing Page (0:00 - 1:00)

**Context:** The old app redirected everyone straight to the Employee dashboard. We've introduced a polished persona-driven entry flow.

1. **Start at the root URL (`/`)**.
2. **Talk Track:** *"Welcome to the CORE Management Platform. Instead of dropping users directly into an assumed dashboard, we've built a robust persona selection screen. This allows us to easily test and demo the five core roles: Employee, Department, Executive, Work Admin, and System Admin."*
3. **Action:** Briefly point out the 7 distinct demo users available for selection.

---

## 🎬 Part 2: Role Routing & The Employee Hub (1:00 - 2:30)

1. **Action:** Click on **Jane Doe (Employee)**.
2. **Talk Track:** *"When Jane logs in, she is immediately routed to the Employee Hub. Notice the polished, responsive layout and the 'My Work' metrics."*
3. **Action:** Navigate to the **Requests** tab (or via sidebar). Show the table of requests.
4. **Talk Track:** *"This is the Employee's view of the world. Notice the clean data tables and the standardized status badges. The entire UI is built on a unified design system that feels premium and responsive."*

---

## 🎬 Part 3: Access Control & Security (2:30 - 3:30)

**Context:** We want to show that the application is actively enforcing role-based boundaries on the client side.

1. **Action:** While still logged in as Jane Doe, manually change the browser URL to `/system/users`.
2. **Talk Track:** *"Security and isolation are critical. If an employee tries to access a restricted area—like the System Admin dashboard—our client-side route guards immediately intercept them."*
3. **Action:** The screen should display the polished **"Access Denied" (403 Forbidden)** page.
4. **Action:** Click the **"Return to Safety"** button to go back to the Employee Hub.

---

## 🎬 Part 4: Work Admin - Real State Mutations (3:30 - 5:30)

**Context:** Moving beyond static mockups, the app now uses a client-side database (`mock-db.ts`) to handle real interactions.

1. **Action:** Use the **Role Switcher** (bottom left corner) to change your persona to **Priya Kapoor (Work Admin)**. 
2. **Talk Track:** *"Let's switch hats and become a Work Admin. We're instantly routed to the Operations Command center. But more importantly, let's look at how we handle incoming work."*
3. **Action:** Navigate to the **Approvals** page in the sidebar.
4. **Talk Track:** *"Here are the pending requests. In the past, clicking these buttons just showed an alert. Now, they are wired to a real local database."*
5. **Action:** Click **"Approve"** on one of the pending requests.
6. **Action:** Point out the toast notification that appears, and how the status badge in the table immediately changes to "Approved".

---

## 🎬 Part 5: The System Admin & Audit Trails (5:30 - 7:00)

**Context:** Proving that actions taken by one role are recorded and visible elsewhere in the system.

1. **Action:** Use the **Role Switcher** to change to **Ray Torres (System Admin)**.
2. **Action:** Navigate to the **System Users** page.
3. **Talk Track:** *"As a System Admin, we manage the platform's infrastructure and personnel. Let's suspend a user."*
4. **Action:** Click **"Suspend User"** on any active user in the table. See the badge change to "Suspended".
5. **Action:** Now, navigate to the **Audit Log** page (`/system/audit`).
6. **Talk Track:** *"Every major action in the system is now tracked. Because our mock database is shared across the session, the user suspension we just performed, as well as the request approval Priya Kapoor did earlier, are all visible right here in the live Audit Log."*

---

## 🎬 Part 6: The API Contract (7:00 - 7:30)

1. **Talk Track:** *"The frontend is now fully polished, type-safe, and E2E tested. To ensure a smooth transition to the backend engineering phase, we've drafted a comprehensive API Contract."*
2. **Action:** Show the `frontend/docs/API_CONTRACT.md` file in the code editor.
3. **Talk Track:** *"This document outlines every REST endpoint, query parameter, and payload the frontend currently expects. It serves as our bridge to the next phase of development."*

## 🎉 Conclusion
*"The frontend foundation is complete. It looks great, it enforces business logic, and it's ready to be wired up to a real backend API."*
