Student Dashboard (Students / Teachers / Admin)

A minimal full-stack Node.js app with Express, SQLite, JWT auth, and role-based dashboards.

Quick start

1. Requirements: Node 18+ (works on Node 22), npm
2. Install and run:

```bash
cd /workspace/student-dashboard
npm install
npm run start
```

The server starts on http://localhost:3000

Demo accounts

- Student: `student@example.com` / `password123`
- Teacher: `teacher@example.com` / `password123`
- Admin: `admin@example.com` / `password123`

Tech

- Express 5, JWT (Authorization: Bearer <token>)
- SQLite (better-sqlite3) with simple seed
- Static frontend (HTML/CSS/JS) with role pages

Structure

```
src/
  server.js           # Express app, routes, static
  db.js               # SQLite schema + seed
  middleware/auth.js  # JWT auth + requireRole
  routes/
    auth.js          # POST /api/auth/login
    dashboard.js     # GET /api/dashboard/*
public/
  index.html login.js styles.css
  student.html student.js
  teacher.html teacher.js
  admin.html   admin.js
```

Environment

Values are loaded from `.env` (created during setup):

- PORT (default: 3000)
- JWT_SECRET (auto-generated)

Notes

- Passwords are hashed with bcrypt.
- Tokens expire in 2h. Client stores token in localStorage.
- This is a starter you can extend with grades, assignments, etc.

