# 🚀 JourneyMan — Production Deployment Guide

This guide provides step-by-step instructions to deploy **JourneyMan** to production using the **Decoupled Architecture (Option B)**:
- **Frontend**: Hosted on [Vercel](https://vercel.com) (Global CDN / Edge)
- **Backend API**: Hosted on [Render](https://render.com) or [Railway](https://railway.app) (Node.js Express + Prisma)
- **Database**: PostgreSQL hosted on [Neon](https://neon.tech) (Serverless Postgres with SSL)

---

## 📋 Pre-Deployment Checklist

Ensure you have the following credentials ready before deploying:

| Variable | Description | Example / How to Get |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://neondb_owner:***@ep-***.us-east-2.aws.neon.tech/neondb?sslmode=require` (From Neon Dashboard) |
| `JWT_SECRET` | 64+ char cryptographic secret | Generated via `npm run generate-secret` |
| `CLIENT_URL` | Frontend Production Domain | `https://your-journeyman-app.vercel.app` |
| `VITE_API_BASE_URL` | Backend Production API URL | `https://journeyman-api.onrender.com/api` |

---

## 🗄️ Step 1: Database Setup (Neon PostgreSQL)

1. **Create Database**: If you haven't already, sign in to [Neon](https://neon.tech) and create a new project.
2. **Copy Connection String**: Select **Connection Details** and copy the URI ending in `?sslmode=require`.
3. **Verify Seed Data**:
   From your local workspace, verify that all teams, players, and daily puzzles are seeded:
   ```bash
   # Run migrations (already applied)
   npm run db:deploy

   # Seed if needed (already seeded with 30 teams, 2,917 players, 180 puzzles)
   npm run db:seed
   ```

---

## ⚙️ Step 2: Deploy Backend API (Render)

### Method A: Using Render Blueprint (Fastest)

1. Push your latest code to your GitHub / GitLab repository.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your `JourneyMan` repository. Render will automatically detect `render.yaml`.
5. Under Environment Variables:
   - Paste your `DATABASE_URL` from Neon.
   - Leave `JWT_SECRET` set to auto-generate (or paste your custom key).
   - Once your frontend is created in Step 3, update `CLIENT_URL` to your Vercel URL (e.g., `https://your-app.vercel.app`).
6. Click **Apply**. Render will build the service and launch your API.
7. Note down your Render service URL (e.g., `https://journeyman-api.onrender.com`).

### Method B: Manual Web Service on Render

1. Click **New +** → **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Name**: `journeyman-api`
   - **Environment**: `Node`
   - **Region**: `Ohio (US East)` (Select the region closest to your Neon DB)
   - **Branch**: `main`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm run start:server`
   - **Health Check Path**: `/api/health`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `<your-neon-postgres-connection-string>`
   - `JWT_SECRET` = `<your-64-character-jwt-secret>`
   - `CLIENT_URL` = `https://your-journeyman-app.vercel.app` (Add after Step 3)
   - `RATE_LIMIT_ENABLED` = `true`
5. Click **Create Web Service**.

---

## 🎨 Step 3: Deploy Frontend (Vercel)

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your `JourneyMan` GitHub repository.
4. In the Project Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (leave at root, Vercel will detect `vercel.json` and workspaces)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (default)
5. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL` = `https://journeyman-api.onrender.com/api` (Both `https://journeyman-api.onrender.com` and `https://journeyman-api.onrender.com/api` are supported)
6. Click **Deploy**.
7. Once deployed, copy your production Vercel domain (e.g., `https://journeyman-game.vercel.app`).

---

## 🔗 Step 4: Finalize Cross-Origin CORS on Backend

1. Return to your [Render Dashboard](https://dashboard.render.com).
2. Go to your `journeyman-api` service → **Environment**.
3. Update `CLIENT_URL` with your exact Vercel production domain:
   ```env
   CLIENT_URL=https://journeyman-game.vercel.app
   ```
4. Click **Save Changes**. Render will automatically redeploy with the updated CORS whitelist and cookie security settings.

---

## 🐳 Step 5 (Alternative): Deploy with Docker / Railway

If you prefer containerized deployment or Railway:

### Deploying to Railway:
1. Click **New Project** → **Deploy from GitHub repo**.
2. Add variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PORT=3001`, `CLIENT_URL`.
3. In **Settings** → **Build & Start**:
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
4. Railway will automatically assign a public domain and SSL certificate.

### Self-Hosted Docker:
```bash
# Build production Docker image
docker build -t journeyman:latest .

# Run container with environment variables
docker run -d \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require" \
  -e JWT_SECRET="your-secure-secret" \
  -e NODE_ENV="production" \
  --name journeyman \
  journeyman:latest
```

---

## 🧪 Post-Deployment Sanity Verification Checklist

After deploying, verify everything works properly:

1. **Backend Health Check**:
   Visit `https://journeyman-api.onrender.com/api/health` in your browser.
   - Expected response: `{"status":"ok","timestamp":"..."}` (HTTP 200).

2. **Daily Puzzle API**:
   Visit `https://journeyman-api.onrender.com/api/puzzle/today`.
   - Expected response: JSON object containing today's puzzle, stint slots, difficulty, and player hints.

3. **Frontend Game Interface**:
   Visit your Vercel URL `https://your-app.vercel.app`.
   - Verify that player stint cards load without network errors.
   - Verify searching for team logos/names in the dropdown.
   - Submit a test guess and confirm feedback tiles animate properly.

4. **User Auth & Stats**:
   - Register a test account or play as guest.
   - Confirm guest session link / login works.
   - Open the Monthly Calendar / Stats modal.

---

## ⏰ Daily Puzzle Generation & Maintenance

The database includes 180 curated daily puzzles. To generate additional puzzles for upcoming months in the future:

```bash
# Generate 180 additional future puzzles
npm run generate-puzzles

# Seed new puzzles to the remote database
DATABASE_URL="<your-neon-url>" npx prisma db seed
```

---

## 🛠️ Troubleshooting

- **CORS error in browser console**:
  Verify `CLIENT_URL` in the Render environment matches your Vercel URL exactly (including `https://` and without a trailing slash).
- **500 Internal Server Error on API**:
  Check Render logs. Ensure `DATABASE_URL` ends with `?sslmode=require`.
- **Images not displaying**:
  Headshots are served from Wikimedia Commons / NBA CDN. Content Security Policy (CSP) is pre-configured to allow `*.wikimedia.org` and `*.nba.com`.
