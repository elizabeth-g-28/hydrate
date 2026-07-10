# Hydrate Backend Setup

Express + Prisma + PostgreSQL backend for projectHydro.

## Local development

### 1. Start PostgreSQL (Docker)

```bash
cd projectHydro
docker compose up -d
```

Postgres runs on **port 5433** (avoids conflict with other projects on 5432).

### 2. Start the backend

```bash
cd backend
npm install
npx prisma migrate dev    # first time only
npm run dev               # http://localhost:4001
```

### 3. Start the frontend

```bash
cd projectHydro
npm install
npm run dev               # http://localhost:5173
```

Set `VITE_API_URL=http://localhost:4001` in `.env`.

## Production deployment (Vercel + Railway)

| Service | Host | Notes |
|---|---|---|
| Frontend (Vite PWA) | Vercel | Already deployed — add `VITE_API_URL` env var |
| Backend (Express) | Railway | Deploy `backend/` folder |
| PostgreSQL | Railway | Add Postgres plugin — auto sets `DATABASE_URL` |

### Railway backend setup

1. Create new Railway project → Deploy from GitHub
2. Set root directory to `backend`
3. Add PostgreSQL database (Railway provides `DATABASE_URL`)
4. Set environment variables:
   - `JWT_ACCESS_SECRET` — strong random string (32+ chars)
   - `JWT_REFRESH_SECRET` — different strong random string
   - `FRONTEND_URL` — your Vercel URL (e.g. `https://your-app.vercel.app`)
   - `GOOGLE_CLIENT_ID` — same Web client ID as `VITE_GOOGLE_CLIENT_ID` on Vercel
   - `NODE_ENV=production`
   - **Web Push (closed-app reminders)** — generate **new** keys with `npx web-push generate-vapid-keys` (do **not** reuse local/dev keys):
     - `VAPID_PUBLIC_KEY`
     - `VAPID_PRIVATE_KEY`
     - `VAPID_SUBJECT` — e.g. `mailto:you@example.com`
     - `REMINDER_PUSH_CHECK_MS` — e.g. `60000` (server check interval)
5. Build command: `npm install && npx prisma generate && npm run build`
6. Start command: `npx prisma migrate deploy && npm start`

### Vercel frontend update

1. Settings → Environment Variables
2. Add `VITE_API_URL=https://your-backend.up.railway.app` (your Railway API URL)
3. Add `VITE_GOOGLE_CLIENT_ID` — same Web client ID as Railway `GOOGLE_CLIENT_ID`
4. Remove old `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if present
5. Redeploy (Vite bakes `VITE_*` at **build** time — change env → redeploy)

**Split of responsibility:** Vercel hosts the PWA only. Push reminders are sent by the **Railway** backend (cron job + VAPID). The browser gets the public key from `GET /api/push/vapid-public-key` on Railway — you do **not** put VAPID private keys on Vercel.

### Production cookie note

The backend sets `sameSite: 'none'` and `secure: true` in production so refresh tokens work cross-origin (Vercel frontend → Railway API).

## API endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login → JWT + cookie |
| POST | `/api/auth/google` | No | Google sign-in → JWT + cookie |
| POST | `/api/auth/logout` | Yes | Clear session |
| GET | `/api/auth/me` | Yes | Current user (login identity) |
| GET | `/api/profile` | Yes | Get hydration profile |
| PUT | `/api/profile` | Yes | Create/update profile |
| GET | `/api/water-entries?date=` | Yes | Entries for a day |
| GET | `/api/water-entries?from=&to=` | Yes | Entries in date range |
| GET | `/api/water-entries/summaries?days=` | Yes | Daily totals for streaks |
| POST | `/api/water-entries` | Yes | Log water |
| DELETE | `/api/water-entries/:id` | Yes | Delete entry |
| GET | `/api/reminders` | Yes | Get reminder settings |
| PUT | `/api/reminders` | Yes | Update reminders |

## Browse the database

```bash
cd backend && npx prisma studio
```

Or connect DBeaver: host `localhost`, port `5433`, db `hydrate_study`, user `hydrateuser`, password `hydratepass`.

## Google Sign-In

Uses **Google Identity Services** (ID token on the frontend, verified on the backend). Email/password login still works alongside Google.

### Flow (study this while testing)

1. User clicks **Continue with Google** on login/register.
2. Google popup returns a short-lived **ID token** (JWT signed by Google).
3. Frontend `POST /api/auth/google` with `{ credential: idToken }`.
4. Backend verifies the token with `google-auth-library` + `GOOGLE_CLIENT_ID`.
5. Backend finds user by `googleId`, or by **email** (links account — sets `googleId` on existing user), or creates a new user.
6. Backend issues the **same JWT access + refresh tokens** as email login.
7. Frontend stores tokens and navigates to the app (onboarding if new).

### Manual setup (you must do this)

1. **Google Cloud Console** → [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID** → type **Web application**
3. **Authorized JavaScript origins:**
   - `http://localhost:5173`
   - `https://your-vercel-app.vercel.app` (production)
4. Copy the **Client ID** (ends in `.apps.googleusercontent.com`)
5. **Local `.env` files** (do not commit real values):
   - `projectHydro/.env` → `VITE_GOOGLE_CLIENT_ID=<client-id>`
   - `projectHydro/backend/.env` → `GOOGLE_CLIENT_ID=<same-client-id>`
6. **Restart** both dev servers after changing env vars.
7. **Production:** add the same Client ID to Vercel (`VITE_GOOGLE_CLIENT_ID`) and Railway (`GOOGLE_CLIENT_ID`), and add your Vercel URL to Google Console origins.

### Account linking

If a user registered with **email + password** and later signs in with Google using the **same email**, the backend links the accounts by setting `googleId` on the existing user. They can then use either method.

### Database migration

After pulling this change, run:

```bash
cd backend
npx prisma migrate deploy   # production
# or
npx prisma migrate dev      # local dev
```

This adds optional `password_hash` and `google_id` on `users`.
