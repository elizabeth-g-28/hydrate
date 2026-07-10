# Hydrate

Progressive Web App for tracking daily water intake, with personalized goals, reminders, history, and analytics.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, Recharts |
| Backend | Express, Prisma, PostgreSQL, JWT auth |
| Auth | Email/password + Google Sign-In |
| Push | Web Push (VAPID) for closed-app reminders |
| PWA | vite-plugin-pwa |

## Prerequisites

- Node.js 20.19+ (or 22.12+)
- Docker (for local PostgreSQL)
- npm

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd projectHydro
npm install
npm install --prefix backend
```

### 2. Environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Set at least:

| File | Variable | Example |
|---|---|---|
| `.env` | `VITE_API_URL` | `http://localhost:4001` |
| `backend/.env` | `DATABASE_URL` | (from `.env.example`) |
| `backend/.env` | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | long random strings |

Optional: Google Sign-In and Web Push — see [BACKEND_SETUP.md](./BACKEND_SETUP.md).

### 3. Start services

```bash
# Terminal 1 — Postgres
docker compose up -d

# Terminal 2 — API
npm run dev:backend

# Terminal 3 — Frontend
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:4001  

First-time DB setup (if needed):

```bash
cd backend && npx prisma migrate dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite frontend |
| `npm run dev:backend` | Start Express API |
| `npm run dev:db` | Start Postgres via Docker |
| `npm run build` | Build frontend for production |
| `npm run check` | Typecheck + lint |
| `npm run preview` | Preview production build |

## Project Structure

```
projectHydro/
├── src/                 # React frontend
│   ├── components/
│   ├── layouts/
│   ├── stores/
│   ├── hooks/
│   ├── lib/             # API client, auth helpers
│   └── utils/
├── backend/             # Express + Prisma API
│   ├── prisma/
│   └── src/
├── BACKEND_SETUP.md     # Backend, push, Google, deploy details
└── docker-compose.yml
```

## Features

- Personalized daily goal (weight × 32.5ml + activity bonus)
- Quick log presets, history, and analytics (streaks / achievements)
- Reminder settings with Do Not Disturb
- Web Push for reminders when the app is closed
- Dark / light theme, metric / imperial units
- Email + Google authentication

## Deployment

Typical split:

- **Frontend** → Vercel (`VITE_API_URL`, optional `VITE_GOOGLE_CLIENT_ID`)
- **Backend + Postgres** → Railway (`DATABASE_URL`, JWT secrets, VAPID, `GOOGLE_CLIENT_ID`)

Full steps: [BACKEND_SETUP.md](./BACKEND_SETUP.md).

## License

MIT
