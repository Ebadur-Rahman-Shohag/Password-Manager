# Deploy to Vercel

This guide deploys the **frontend** (React) and **backend** (Express API) together on Vercel as **one project**.

We use one domain (for example `https://your-app.vercel.app`) so login cookies work correctly. The frontend is served as static files; API requests go to `/api/*` on the same domain.

---

## Before you start

You will need:

1. A [Vercel](https://vercel.com) account  
2. A [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster (Vercel cannot run MongoDB for you)  
3. Your code pushed to GitHub, GitLab, or Bitbucket  

---

## Step 1 — Set up MongoDB Atlas

1. Create a free **M0** cluster in MongoDB Atlas.  
2. Create a database user (username + password).  
3. Under **Network Access**, allow your IP or `0.0.0.0/0` (anywhere) so Vercel can connect.  
4. Click **Connect → Drivers** and copy the connection string.  
5. Replace `<password>` with your user password and set a database name:

   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/password-manager?retryWrites=true&w=majority
   ```

Save this — you will use it as `MONGODB_URI`.

---

## Step 2 — Add Vercel config files to the repo

These files are already in the repo (`api/index.js`, `vercel.json`, `.env.vercel.example`). You only need to install dependencies:

```bash
npm install
```

(`serverless-http` is included in the backend workspace.)

### 2b. Create `api/index.js` (project root)

Already included in the repo. It wraps the Express app for Vercel serverless:

```javascript
const serverless = require("serverless-http");
const { connectDb } = require("../backend/dist/config/db");
const { app } = require("../backend/dist/app");
// ...
```

### 2c. Create `vercel.json` (project root)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/auth/:path*", "destination": "/api" },
    { "source": "/vault/:path*", "destination": "/api" },
    { "source": "/health", "destination": "/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

**What this does:**

- Builds the whole monorepo (`shared` → `backend` → `frontend`)
- Serves the React app from `frontend/dist`
- Sends `/auth/*`, `/vault/*`, and `/health` to the Express API
- Sends all other routes to `index.html` (React Router)

### 2d. Update frontend CSP for production

In `frontend/index.html`, change the `connect-src` line so it allows your own domain only (same-origin `/api` is covered by `'self'`):

```html
connect-src 'self';
```

Remove `http://localhost:3000` before deploying.

### 2e. API URL (already configured)

- **Production (Vercel):** requests go to `/auth`, `/vault` on the same domain (`VITE_API_URL` empty).
- **Local dev:** `frontend/.env.development` sets `VITE_API_URL=/api` for the Vite proxy.

No manual change needed unless you use a separate API domain.

---

## Step 3 — Push to Git

```bash
git add .
git commit -m "Add Vercel deployment config"
git push
```

---

## Step 4 — Create the Vercel project

1. Go to [vercel.com/new](https://vercel.com/new)  
2. Import your repository  
3. **Root Directory:** leave as `.` (repo root)  
4. **Framework Preset:** Other (Vercel reads `vercel.json`)  
5. Add **Environment Variables** (Production):

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://...` | From Atlas |
| `JWT_SECRET` | long random string | Run: `openssl rand -base64 48` |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel URL (update after first deploy if needed) |
| `COOKIE_SECURE` | `true` | Required for HTTPS |
| `NODE_ENV` | `production` | Enables HSTS |
| `JWT_EXPIRES_IN` | `1d` | Optional |
| `JWT_SLIDING_THRESHOLD` | `6h` | Optional |
| `ALLOW_BEARER_AUTH` | `false` | Optional |
| `VITE_API_URL` | *(empty)* | Same-origin API |

6. Click **Deploy**

---

## Step 5 — After the first deploy

1. Copy your live URL (example: `https://password-manager-abc.vercel.app`).  
2. In Vercel → **Settings → Environment Variables**, set `FRONTEND_URL` to that exact URL (no trailing slash).  
3. **Redeploy** so CORS and cookies use the correct origin.

---

## Step 6 — Verify it works

Open your Vercel URL and check:

- [ ] Register a new account  
- [ ] Unlock vault with master password  
- [ ] Add a vault entry  
- [ ] Refresh the page — still logged in  
- [ ] Log out — redirected to login  

In DevTools → **Application → Cookies**:

- `auth_token` exists with **HttpOnly** and **Secure**

Run the security script against your live API (optional):

```bash
npm run security:audit -- --base https://your-app.vercel.app
```

---

## Environment variables reference

| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URI` | Yes | Atlas connection string |
| `JWT_SECRET` | Yes | Random 48+ char secret |
| `FRONTEND_URL` | Yes | `https://your-app.vercel.app` |
| `COOKIE_SECURE` | Yes | `true` |
| `NODE_ENV` | Yes | `production` |
| `VITE_API_URL` | No | Empty = same origin |
| `JWT_EXPIRES_IN` | No | `1d` |
| `JWT_SLIDING_THRESHOLD` | No | `6h` |
| `ALLOW_BEARER_AUTH` | No | `false` |

---

## Troubleshooting

### “Failed to load” or network errors on login

- Check `FRONTEND_URL` matches your Vercel domain exactly  
- Redeploy after changing env vars  
- Confirm `COOKIE_SECURE=true`  

### MongoDB connection errors

- Check `MONGODB_URI` is correct  
- Allow `0.0.0.0/0` in Atlas Network Access  
- Check database user password (URL-encode special characters)  

### 404 on page refresh (e.g. `/vault`)

- Confirm `vercel.json` has the SPA rewrite to `/index.html`  

### API returns 500 on cold start

- Open Vercel → **Deployments → Functions → Logs**  
- Usually a missing env var or MongoDB connection issue  

### Rate limit seems inconsistent

- On serverless, rate limits are per instance, not global. This is normal for Vercel. For stricter limits, use Redis (advanced).  

---

## Two separate Vercel projects (not recommended)

You *can* deploy frontend and backend as two projects, but cookies are harder:

- Frontend: `https://my-app.vercel.app`  
- Backend: `https://my-api.vercel.app`  

You would need:

- `VITE_API_URL=https://my-api.vercel.app`  
- Cookie `SameSite=None` + `Secure` (code change)  
- `FRONTEND_URL` on the backend  

**Use one project** unless you have a strong reason to split them.

---

## Local vs production

| | Local dev | Vercel |
|---|-----------|--------|
| Frontend | `http://localhost:5173` | `https://your-app.vercel.app` |
| API | `http://localhost:3000` via proxy | Same domain `/auth`, `/vault` |
| MongoDB | Local or Atlas | Atlas only |
| Cookies | `COOKIE_SECURE=false` | `COOKIE_SECURE=true` |

---

## Quick checklist

```
[ ] MongoDB Atlas cluster ready
[ ] api/index.js + vercel.json in repo (done)
[ ] serverless-http installed (npm install)
[ ] CSP updated in index.html (done)
[ ] Code pushed to Git
[ ] Vercel project created with env vars (see .env.vercel.example)
[ ] FRONTEND_URL updated after first deploy
[ ] Register / login / vault tested on live URL
```

That’s it. Your password manager should be live on Vercel.
