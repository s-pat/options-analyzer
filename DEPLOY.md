# Deployment Guide — OptionLabs

This guide covers three scenarios:
1. **Local QA** — run the full stack locally with Docker Compose
2. **QAA / Production on the web** — backend on Railway + frontend on Vercel (free tiers)
3. **What your friends need** — just a URL, nothing to install

---

## Option A: Local Docker QA (test before deploying)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run
```bash
# From the repo root
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend health → http://localhost:8080/health

The web container proxies all `/api/v1/*` requests to the API container internally — no CORS issues, no secrets exposed to the browser.

### Stop
```bash
docker compose down
```

---

## Option B: Deploy to the Web (Vercel + Railway)

This gives your friends a real public URL. Both services have generous free tiers.

### Step 1 — Push to GitHub

```bash
cd /path/to/release-candidate-0.0.1
git init
git add .
git commit -m "initial release"
```

Create a repo on https://github.com/new (keep it **private** if you prefer), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/optionslab.git
git push -u origin main
```

---

### Step 2 — Deploy the Go backend on Railway

1. Go to https://railway.app and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `optionslab` repo
4. Railway will ask which directory — set the **Root Directory** to `apps/api`
   - It detects the `Dockerfile` automatically
5. After the first deploy completes, go to **Settings → Networking → Generate Domain**
   - Note your URL, e.g. `https://optionslab-api.up.railway.app`
6. In **Variables**, add:

| Variable | Value |
|---|---|
| `GIN_MODE` | `release` |
| `ALLOWED_ORIGINS` | `https://YOUR-APP.vercel.app` (fill in after Step 3) |

> **PORT is set automatically by Railway** — our server already reads it from the environment.

---

### Step 3 — Deploy the Next.js frontend on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project**
3. Import your `optionslab` repo
4. Set **Root Directory** to `apps/web`
5. Vercel auto-detects Next.js — keep all defaults
6. In **Environment Variables**, add:

| Variable | Value | Scope |
|---|---|---|
| `API_BACKEND_URL` | `https://optionslab-api.up.railway.app` | Production + Preview |

7. Click **Deploy**
8. Note your Vercel URL, e.g. `https://optionslab.vercel.app`

---

### Step 4 — Wire CORS (back to Railway)

1. Go back to Railway → your API service → **Variables**
2. Update `ALLOWED_ORIGINS` to your actual Vercel URL:
   ```
   https://optionslab.vercel.app
   ```
3. Railway redeploys automatically

---

### Step 5 — Verify

```bash
# Backend health
curl https://optionslab-api.up.railway.app/health

# Market data through the Vercel proxy
curl https://optionslab.vercel.app/api/v1/market/overview
```

Share `https://optionslab.vercel.app` with your friends — they just need a browser.

---

## Environment Variable Reference

### Backend (`apps/api`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | HTTP listen port (set automatically by Railway) |
| `GRPC_PORT` | `9090` | gRPC listen port (internal only) |
| `GIN_MODE` | `debug` | Set to `release` in production |
| `ALLOWED_ORIGINS` | `http://localhost:3000,...` | Comma-separated CORS allow-list |

### Frontend (`apps/web`)

| Variable | Default | Description |
|---|---|---|
| `API_BACKEND_URL` | `http://localhost:8080` | Backend URL for server-side proxy (never sent to browser) |
| `NEXT_PUBLIC_API_URL` | `/api/v1` | Browser-facing API prefix — leave as default |

---

## Security Notes

- **No API keys** — Yahoo Finance data requires no credentials
- **`API_BACKEND_URL` is server-side only** — the Railway URL is never exposed to users' browsers; all traffic is proxied through the Next.js server
- **CORS** is locked to your Vercel domain in production
- **`GIN_MODE=release`** suppresses debug log output in production
- **Least-privilege Docker images** — the web container runs as a non-root user; the API image is a minimal Alpine binary

---

## Custom Domain (optional)

Vercel: **Project → Settings → Domains → Add**
Railway: **Service → Settings → Networking → Custom Domain**

Once you add a custom domain (e.g. `optionslab.io`), update `ALLOWED_ORIGINS` in Railway to match.
