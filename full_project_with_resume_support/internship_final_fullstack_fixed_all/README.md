Internship & Skill Tracker — Full Stack (Final ZIP)
--------------------------------------------------

Contents:
- backend/: Express + MongoDB + JWT auth
- frontend/: React (Vite) + Tailwind + Heroicons + Framer Motion + Recharts UI

Quick start (local):

1) Backend
  - cd backend
  - npm install
  - create .env from .env.sample and set MONGO_URI
  - node seed.js   # creates demo users and jobs
  - npm run dev   # starts backend on PORT (default 5000)

2) Frontend
  - cd frontend
  - npm install
  - npm run dev   # starts Vite on http://localhost:5173
  - open http://localhost:5173

Demo accounts (seed creates):
  - student@demo.com  (role: student)
  - faculty@demo.com  (role: faculty)
  - admin@demo.com    (role: admin)
  - hr@demo.com       (role: company)

Notes:
- This project uses a demo login by email only (no password) for speed. It returns a JWT.
- Replace JWT secret in backend/.env before production.
- Tailwind is configured for the frontend; run `npm install` in frontend to get dependencies.

If you want, I can deploy this to Render/Vercel for a live demo, or provide a short demo video script.
