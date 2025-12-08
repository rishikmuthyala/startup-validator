# 🔗 Fix Sharing Functionality

## Problem
The share button returns a 503 error because Vercel KV environment variables are missing.

## Solution

### Step 1: Set Up Vercel KV (Do this first!)

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Select your project** (startup-validator)

3. **Create KV Database**
   - Click **"Storage"** tab
   - Click **"Create Database"**  
   - Select **"KV"** (Redis)
   - Name: `startup-validator-kv`
   - Click **"Create"**

4. **Connect to Project**
   - Click **"Connect to Project"**
   - Select `startup-validator`
   - Click **"Connect"**
   - ✅ Environment variables auto-added!

5. **Redeploy**
   - Go to **"Deployments"** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

### Step 2: Set Up Local Development

Run these commands in your terminal:

```bash
# Login to Vercel (if not already)
vercel login

# Link your project
vercel link

# Pull KV environment variables
vercel env pull .env.local

# Restart dev server
# Stop current dev server (Ctrl+C)
npm run dev
```

### Step 3: Verify It Works

**Test in Production:**
1. Go to your Vercel URL (e.g., `startup-validator.vercel.app`)
2. Complete a validation
3. Click **"Share Results"** button
4. ✅ Should copy link and show social sharing buttons!

**Test Locally:**
1. Complete a validation at `localhost:3000`
2. Click **"Share Results"** button  
3. Open the shared link in incognito mode
4. ✅ Results should load!

## What Was Wrong

Your `.env.local` has:
```
REDIS_URL="redis://..."  # ❌ Wrong format
```

But the code needs:
```
KV_REST_API_URL="https://..."  # ✅ Required
KV_REST_API_TOKEN="..."         # ✅ Required
```

Vercel KV uses REST API (not Redis protocol), so you need the KV-specific variables.

## Quick Check

After setup, your `.env.local` should have:
```bash
OPENAI_API_KEY=sk-...
BRAVE_SEARCH_API_KEY=BSA_...
KV_REST_API_URL=https://...           # NEW
KV_REST_API_TOKEN=...                 # NEW
KV_REST_API_READ_ONLY_TOKEN=...       # NEW
```

And you can remove the old `REDIS_URL` line.
