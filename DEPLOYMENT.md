# HealthSync — Permanent Cloud Deployment (Vercel + Render + Cloud MySQL)

Your **frontend** (Vercel) and **backend** (Render) are already deployed.  
Render **cannot** use `localhost` MySQL — you need a **cloud MySQL** database and env vars on Render.

---

## Architecture

```
Browser → Vercel (React) → Render (Node API) → Cloud MySQL
```

| Service | URL (yours) |
|---------|-------------|
| Frontend | Your `*.vercel.app` domain |
| Backend | `https://healthsync-backend-ofkq.onrender.com` |

---

## Step 1 — Create a cloud MySQL database

Pick **one** provider (all work with Render):

### Option A: Railway (recommended, easy)

1. Go to [railway.app](https://railway.app) → New Project → **Provision MySQL**
2. Open the MySQL service → **Variables** tab
3. Copy: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`  
   (or the full `MYSQL_URL` / `DATABASE_URL`)

### Option B: Aiven / TiDB / PlanetScale

Create a MySQL instance and note host, port, user, password, database name.

---

## Step 2 — Configure Render (backend)

1. [Render Dashboard](https://dashboard.render.com) → your **healthsync-backend** service  
2. **Environment** → add:

| Key | Value |
|-----|--------|
| `DB_HOST` | From cloud MySQL (e.g. `containers-us-west-xxx.railway.app`) |
| `DB_PORT` | Usually `3306` |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (e.g. `railway`) |
| `DB_SSL` | `true` |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://healthsync-hospital-management.vercel.app` |

**Or** use a single connection string:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | `mysql://USER:PASSWORD@HOST:PORT/DATABASE` |
| `DB_SSL` | `true` |

3. **Save** → Render will redeploy automatically.

4. Test: open  
   `https://healthsync-backend-ofkq.onrender.com/api/health`  
   You should see: `{"status":"ok","database":"connected"}`

---

## Step 3 — Load schema & sample data (one time)

On your PC, create `.env` in the project root with **cloud** DB credentials (same as Render):

```env
DB_HOST=your-cloud-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database
DB_SSL=true
```

Then run:

```bash
cd backend
npm install
npm run bootstrap-production
npm run create-admin -- Saksham5437 YourPassword "Saksham Admin"
```

This creates tables, 15 doctors, 30 patients, rooms, staff, and your admin login.

---

## Step 4 — Configure Vercel (frontend)

1. [Vercel Dashboard](https://vercel.com) → your project → **Settings** → **Environment Variables**
2. Add for **Production**:

| Key | Value |
|-----|--------|
| `REACT_APP_API_BASE_URL` | `https://healthsync-backend-ofkq.onrender.com` |

3. **Redeploy** the frontend (Deployments → ⋮ → Redeploy).

`frontend/.env.production` already has this URL for future builds from Git.

---

## Step 5 — Sign in on the live site

1. Open your **Vercel** URL (not localhost)
2. Login → **Admin**
3. Username / password you created with `create-admin`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Database is not configured` on Render | Add `DB_*` or `DATABASE_URL` env vars on Render |
| `Cannot reach the API` on Vercel | Set `REACT_APP_API_BASE_URL` on Vercel and redeploy |
| Render slow first request | Free tier sleeps ~50s; wait and retry |
| `/api/health` shows DB error | Wrong credentials or MySQL not allowing external connections |
| Invalid password | Run `npm run reset-password -- username newpass` against cloud DB |

---

## Keep backend awake (optional)

Render free tier sleeps after inactivity. Options:

- Upgrade Render plan, or  
- Use a free uptime pinger (e.g. UptimeRobot) hitting `/api/health` every 14 minutes

---

## Deploy updates

```bash
git add .
git commit -m "Your message"
git push origin main
```

Vercel and Render auto-deploy from GitHub when connected.
