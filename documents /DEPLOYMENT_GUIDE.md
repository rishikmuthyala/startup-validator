# 🚀 Deployment Guide - Startup Validator

This guide will help you deploy your startup validator to production and make it live for sharing on LinkedIn and other platforms.

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

- [x] Completed at least one full validation (testing)
- [x] OpenAI API key configured
- [ ] Vercel KV database set up (for shareable results)
- [ ] Custom domain ready (optional but recommended)
- [ ] Error tracking configured (optional but recommended)

---

## 🎯 Quick Deploy to Vercel (Recommended)

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Link Your Project

```bash
vercel link
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time) or **Y** (if already deployed)
- Project name? `startup-validator` (or your preferred name)

### Step 4: Add Environment Variables

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key | Production, Preview, Development |

#### Option B: Via CLI

```bash
# Add OpenAI API key
vercel env add OPENAI_API_KEY
# Select: Production, Preview, Development
# Paste your API key when prompted
```

### Step 5: Set Up Vercel KV (For Shareable Results)

**IMPORTANT:** Without Vercel KV, the share functionality won't work. Follow these steps:

1. In Vercel Dashboard, go to your project
2. Click **Storage** tab
3. Click **Create Database**
4. Select **KV** (Redis)
5. Name it: `startup-validator-kv`
6. Click **Create**
7. Click **Connect to Project**
8. Select your project
9. Click **Connect**

✅ Environment variables are now automatically added!

**For local development:**

```bash
# Pull environment variables (including KV credentials)
vercel env pull .env.local

# Restart dev server
npm run dev
```

See `VERCEL_KV_SETUP.md` for detailed setup and testing instructions.

### Step 6: Deploy to Production

```bash
vercel --prod
```

Wait for deployment to complete (~2-3 minutes).

You'll get a production URL like: `https://startup-validator.vercel.app`

### Step 7: Test Your Deployment

1. Visit your production URL
2. Complete a full validation (7 questions)
3. Click **"Share Results →"** button
4. Verify:
   - ✅ Link is copied to clipboard
   - ✅ Share URL is displayed
   - ✅ Social share buttons appear
   - ✅ Opening link in incognito shows the results

**If sharing doesn't work:**
- Check Vercel KV is connected
- Verify environment variables in Vercel Dashboard
- Check deployment logs: `vercel logs`

---

## 🌐 Custom Domain Setup (Recommended for LinkedIn)

Using a custom domain makes your app look more professional when sharing on LinkedIn.

### Step 1: Add Domain in Vercel

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Enter your domain (e.g., `validator.yourdomain.com`)
4. Click **Add**

### Step 2: Configure DNS

Vercel will show you DNS records to add. Common configurations:

#### For subdomain (e.g., validator.yourdomain.com):
```
Type: CNAME
Name: validator
Value: cname.vercel-dns.com
```

#### For root domain (e.g., yourdomain.com):
```
Type: A
Name: @
Value: 76.76.21.21
```

### Step 3: Wait for DNS Propagation

- Usually takes 5-60 minutes
- Vercel will automatically provision SSL certificate
- You'll see a green checkmark when ready

### Step 4: Update Environment Variables

If you're using a custom domain, update the base URL:

```bash
vercel env add NEXT_PUBLIC_BASE_URL
# Value: https://validator.yourdomain.com
# Select: Production
```

---

## 📊 Optional: Add Analytics

### Vercel Analytics (Easiest)

1. In Vercel Dashboard → Your Project
2. Go to **Analytics** tab
3. Click **Enable Analytics**
4. Free tier: 100k events/month

No code changes needed!

### Google Analytics

1. Get GA4 Measurement ID from Google Analytics
2. Add to `app/layout.js`:

```javascript
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

---

## 🐛 Optional: Error Tracking

### Sentry (Recommended)

1. Sign up at https://sentry.io
2. Create a new project (Next.js)
3. Install Sentry:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

4. Follow the wizard prompts
5. Deploy:

```bash
vercel --prod
```

---

## 📱 Sharing on LinkedIn

Once deployed, here's how to share effectively:

### Post Template

```
Just launched my startup validator tool! 🚀

It uses AI to validate startup ideas in 7 questions and provides:
• Honest viability score
• Competitive analysis
• Actionable next steps

Try it out: [your-url]

Built with Next.js, OpenAI, and Vercel KV.

#startup #ai #buildinpublic
```

### Best Practices

1. **Add a preview image:**
   - Screenshot of your results page
   - Score + verdict visible
   - Use bright colors for attention

2. **Post timing:**
   - Best times: Tuesday-Thursday, 10am-2pm
   - Avoid weekends for B2B content

3. **Engagement strategy:**
   - Reply to every comment in first hour
   - Ask a question to drive engagement
   - Share your own validation result first

4. **Follow-up posts:**
   - Day 2: Share interesting findings
   - Day 7: Share user stats/feedback
   - Day 30: Share what you learned

---

## 🔧 Troubleshooting

### Deployment Fails

**Check build logs:**
```bash
vercel logs --follow
```

**Common issues:**
- Missing environment variables → Add via Vercel Dashboard
- Build errors → Test locally with `npm run build`
- API routes failing → Check API logs in Vercel Dashboard

### Share Feature Not Working

**Symptoms:** "Sharing is not available" message

**Solutions:**

1. **Verify Vercel KV is connected:**
   - Vercel Dashboard → Storage → Verify KV exists
   - Settings → Environment Variables → Check KV vars exist

2. **Check environment variables:**
   ```bash
   vercel env ls
   ```
   Should show:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

3. **Redeploy after adding KV:**
   ```bash
   vercel --prod
   ```

### Shared Links Not Loading

**Check Vercel KV Dashboard:**
1. Go to KV database
2. Click **Data Browser**
3. Look for `result:*` keys
4. If empty, sharing isn't saving

**Check logs:**
```bash
vercel logs --follow
```

Look for `[Storage]` or `[Share API]` errors.

---

## 📈 Monitoring Production

### Check Deployment Status

```bash
vercel ls startup-validator
```

### View Real-Time Logs

```bash
vercel logs --follow
```

### Check Analytics

1. Vercel Dashboard → Analytics
2. Monitor:
   - Page views
   - API calls
   - Error rates
   - Response times

### Monitor Vercel KV Usage

1. Vercel Dashboard → Storage → Your KV
2. Click **Insights**
3. Watch:
   - Storage used (256 MB limit on free tier)
   - Commands per day (10,000 limit)
   - Latency

### Set Up Alerts

In Vercel Dashboard:
1. Project Settings → Notifications
2. Add notification for:
   - Deployment failures
   - High error rates
   - Storage > 80%

---

## 🔄 Making Updates

After making code changes:

### Deploy to Preview (Test First)

```bash
vercel
```

This creates a preview deployment. Test it thoroughly before production.

### Deploy to Production

```bash
vercel --prod
```

### Roll Back if Needed

```bash
vercel rollback
```

---

## 💰 Cost Estimate

### Vercel (Hobby/Free Tier)
- **Cost:** $0/month
- **Includes:**
  - Unlimited deployments
  - 100GB bandwidth
  - Automatic SSL
  - Preview deployments

**When to upgrade to Pro ($20/mo):**
- Need more than 1 team member
- Need priority support
- Need analytics for >100k events/month

### Vercel KV (Free Tier)
- **Cost:** $0/month
- **Includes:**
  - 256 MB storage (~32,000 results)
  - 10,000 commands/day
  - 30-day TTL (auto-cleanup)

**When to upgrade to Pro ($20/mo):**
- Consistently hitting 1000+ validations/day
- Need longer retention (>30 days)
- Need more storage (1 GB on Pro)

### OpenAI API
- **Model:** GPT-4o-mini
- **Cost:** ~$0.02 per validation
  - 7 questions: ~5,000 tokens
  - 1 analysis: ~3,000 tokens
  - Total: ~$0.02

**Monthly cost estimates:**
- 100 validations: ~$2
- 500 validations: ~$10
- 1000 validations: ~$20

**Budget tip:** Set usage limits in OpenAI Dashboard.

---

## ✅ Post-Launch Checklist

After deploying:

- [ ] Test full validation flow in production
- [ ] Test share functionality (incognito mode)
- [ ] Share on LinkedIn with preview image
- [ ] Set up Vercel Analytics
- [ ] Add error tracking (Sentry)
- [ ] Set up usage alerts (Vercel + OpenAI)
- [ ] Monitor for first 24 hours
- [ ] Respond to all comments/feedback
- [ ] Plan follow-up posts

---

## 🚀 You're Live!

Your startup validator is now live and ready to share! 

**Share your deployment:**
- Post on LinkedIn
- Share in startup communities
- Add to your portfolio
- Submit to product directories (Product Hunt, etc.)

**Track your metrics:**
- Validations completed
- Share rate (% who click share)
- Viral coefficient (shares → new users)
- Most common startup ideas

**Questions?** Check:
1. Vercel logs: `vercel logs`
2. API routes in Vercel Dashboard
3. Vercel KV Data Browser
4. OpenAI usage dashboard

**Good luck! 🎉**
