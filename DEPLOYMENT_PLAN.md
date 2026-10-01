# Deployment Plan: ShareExpenses (Splitwise Clone)

This document outlines the deployment strategy, free-tier hosting comparison, and step-by-step setup guides for deploying the ShareExpenses application on **Vercel** (recommended) or **Netlify** (alternative).

---

## 1. Free-Tier Platform Comparison (Hobby App)

| Metric / Feature | **Vercel (Hobby Tier)** | **Netlify (Starter Tier)** | **Render (Free)** | **Cloudflare Pages** |
| :--- | :--- | :--- | :--- | :--- |
| **Price** | **$0 / month** | **$0 / month** | **$0 / month** | **$0 / month** |
| **Next.js 14 App Router** | **Native (First-party)** | Via adapter plugin | Node server (`npm start`) | Requires OpenNext adapter |
| **Build Minutes** | **6,000 min / month** | 300 min / month | 500 min / month | Unlimited builds |
| **Bandwidth** | 100 GB / month | 100 GB / month | 100 GB / month | Unlimited |
| **Serverless Functions** | 100 GB-hrs / month | 125,000 invocations / mo | 750 hrs (Sleeps on idle) | 100k requests / day |
| **Cold Starts** | Instant / Low ms | Low ms | **50+ sec delay** (spins down) | Fast (Edge) |
| **Maintenance Effort** | **Zero configuration** | Minimal | Low | Medium / Complex |

### Recommendation: Vercel (Hobby Tier)

1. **Native Next.js 14 App Router & API Route Execution:**
   ShareExpenses relies on Next.js server-side API routes for expense creation, member invitations, balance settlement calculations, and closeouts. Vercel runs these natively with zero adapter overhead.
2. **20x More Build Minutes:**
   Vercel provides 6,000 build minutes/month versus Netlify's 300 build minutes/month. With Next.js builds taking ~1.5–2 minutes, Netlify's free build quota can be exhausted after ~150 deploys in a month.
3. **Secure Secrets Isolation:**
   Server-side secrets such as `SUPABASE_SERVICE_ROLE_KEY` are safely isolated from client builds.
4. **No Cold-Start Sleeping:**
   Unlike Render or Fly.io (which sleep after 15 minutes of inactivity), serverless endpoints stay ready without a 50-second wake-up wait for friends using the app.
5. **Existing Repository Configuration:**
   The repository already includes `vercel.json` configured for build commands and environment mapping.

---

## 2. Option A: Deploying on Vercel (Recommended)

### Step 1: Push Code to GitHub

Ensure your local Git commits are up to date and pushed to GitHub:

```bash
# Check repository status
git status

# Stage and commit any pending changes
git add .
git commit -m "chore: prepare for production deployment"

# Push to your remote repository
git push origin main
```

### Step 2: Deploy via Vercel Web Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New...** > **Project**.
3. Under **Import Git Repository**, locate `karthikrchandran/shareexpenses` and click **Import**.
4. Configure Project Settings:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. Expand **Environment Variables** and enter the following keys:

   | Key | Description | Environment |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (`https://<project-id>.supabase.co`) | Production, Preview |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key | Production, Preview |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret key | Production, Preview |
   | `NEXT_PUBLIC_APP_URL` | Your production URL (e.g. `https://shareexpenses.vercel.app`) | Production |

6. Click **Deploy**. Vercel will install dependencies, build the Next.js bundle, and provide a live URL.

### Alternative: Deploy via Vercel CLI

```bash
# 1. Install CLI
npm install -g vercel

# 2. Authenticate
vercel login

# 3. Link and configure variables
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production

# 4. Deploy to production
vercel --prod
```

### Step 3: Configure Supabase Redirect URLs for Vercel

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** > **URL Configuration**.
3. Set **Site URL** to:
   ```text
   https://<your-project-name>.vercel.app
   ```
4. In **Redirect URLs**, add:
   ```text
   https://<your-project-name>.vercel.app/**
   https://<your-project-name>.vercel.app/api/auth/callback
   ```
5. Click **Save**.

---

## 3. Option B: Deploying on Netlify (Alternative)

### Step 1: Push Code to GitHub

```bash
git push origin main
```

### Step 2: Deploy via Netlify Dashboard

1. Go to [netlify.com](https://www.netlify.com) and sign in using your GitHub account.
2. Click **Add new site** > **Import an existing project**.
3. Select **GitHub** and grant permissions for `karthikrchandran/shareexpenses`.
4. Configure Build Settings:
   - **Base directory:** Leave blank (root)
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Next.js Runtime:** Netlify will automatically detect Next.js and install `@netlify/plugin-nextjs`.
5. Under **Environment variables**, click **Add a variable** for each:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<project-id>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<service-role-key>`
   - `NEXT_PUBLIC_APP_URL`: `https://<your-site-name>.netlify.app`
6. Click **Deploy site**. Netlify will build and generate your `*.netlify.app` domain.

### Alternative: Deploy via Netlify CLI

```bash
# 1. Install CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Initialize site
netlify init

# 4. Set environment variables
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://<project-id>.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "<anon-key>"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "<service-role-key>"
netlify env:set NEXT_PUBLIC_APP_URL "https://<your-site-name>.netlify.app"

# 5. Build & deploy to production
netlify deploy --prod --build
```

### Step 3: Configure Supabase Redirect URLs for Netlify

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** > **URL Configuration**.
3. Set **Site URL** to:
   ```text
   https://<your-site-name>.netlify.app
   ```
4. In **Redirect URLs**, add:
   ```text
   https://<your-site-name>.netlify.app/**
   https://<your-site-name>.netlify.app/api/auth/callback
   ```
5. Click **Save**.

---

## 4. Total Hobby Cost Breakdown

| Component | Provider | Tier | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Frontend & API Routes** | Vercel (or Netlify) | Hobby / Starter | **$0.00** |
| **Database (PostgreSQL)** | Supabase | Free Tier (500 MB DB) | **$0.00** |
| **Authentication** | Supabase Auth | Free Tier (50,000 MAU) | **$0.00** |
| **SSL / HTTPS** | Automated Let's Encrypt | Included | **$0.00** |
| **Continuous Deployment** | GitHub Actions / Git integration | Included | **$0.00** |
| **Total** | | | **$0.00 / month** |

---

## 5. Post-Deployment Verification Checklist

After deploying to either platform:

- [ ] **Authentication Flow:** Register a test account and verify email login/redirection.
- [ ] **Dashboard Loading:** Verify existing expense sets and groups render properly.
- [ ] **Create Expense:** Add a new expense and check that splits update in real-time.
- [ ] **Settlements & Closeouts:** Verify that balance calculations and settlements display accurately.
- [ ] **Continuous Deployment Check:** Push a small commit to `main` and ensure automated deployment triggers and finishes green.
