# Deploying AC Multiposter to Cloudflare Pages

This guide walks you through deploying your AC Multiposter application to Cloudflare Pages with a Postgres database and Cloudflare Cron Triggers for webhook renewal.

## Prerequisites

- A Cloudflare account (free tier works)
- A Postgres database (see Database Options below)
- Google OAuth credentials configured
- Your GitHub repository pushed to GitHub

## Table of Contents

1. [Database Setup](#1-database-setup)
2. [Cloudflare Pages Setup](#2-cloudflare-pages-setup)
3. [Environment Variables](#3-environment-variables)
4. [Google OAuth Configuration](#4-google-oauth-configuration)
5. [Database Migration](#5-database-migration)
6. [Cloudflare Cron Jobs](#6-cloudflare-cron-jobs-webhook-renewal)
7. [Testing Your Deployment](#7-testing-your-deployment)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Database Setup

You need a Postgres database accessible from the internet. Choose one of these options:

### Option A: Neon (Recommended - Free Tier Available)

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Create a database
4. Copy the connection string (starts with `postgresql://`)

### Option B: Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string (use the "Connection pooling" one for better performance)

### Option C: Railway, Render, or other providers

Follow their documentation to create a Postgres database and obtain the connection string.

---

## 2. Cloudflare Pages Setup

### Step 1: Connect Your Repository

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create application**
3. Select **Pages** tab
4. Click **Connect to Git**
5. Authorize Cloudflare to access your GitHub account
6. Select your `ac-multiposter` repository
7. Click **Begin setup**

### Step 2: Configure Build Settings

On the setup page, configure:

- **Production branch**: `main` (or your default branch)
- **Framework preset**: Select "SvelteKit"
- **Build command**: `pnpm build`
- **Build output directory**: `.svelte-kit/cloudflare`

**Important Build Settings:**

- **Node.js version**: Set to `20` or higher
  - In **Build settings** → **Environment variables (advanced)**
  - Add: `NODE_VERSION` = `20`

Click **Save and Deploy** (it will fail initially - that's okay, we need to add environment variables first)

---

## 3. Environment Variables

### Step 1: Add Environment Variables in Cloudflare

1. In your Cloudflare Pages project, go to **Settings** → **Environment variables**
2. Add the following variables for **Production** environment:

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | Your Postgres connection string | `postgresql://user:pass@host:5432/dbname` |
| `BETTER_AUTH_SECRET` | Random secure string (32+ characters) | Use: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Your Cloudflare Pages URL | `https://ac-multiposter.pages.dev` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | `GOCSPX-xxx` |
| `MICROSOFT_CLIENT_ID` | (Optional) From Azure | `xxx` |
| `MICROSOFT_CLIENT_SECRET` | (Optional) From Azure | `xxx` |
| `CRON_SECRET` | Random secure string for cron auth | Use: `openssl rand -base64 32` |

**To generate secure secrets on Windows:**

```powershell
# Using PowerShell
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Step 2: Note Your Cloudflare Pages URL

After deployment, Cloudflare assigns a URL like:
- `https://ac-multiposter.pages.dev` (main production)
- Or `https://[deployment-id].ac-multiposter.pages.dev` (preview deployments)

You'll need this for the next step.

---

## 4. Google OAuth Configuration

### Update Authorized Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://ac-multiposter.pages.dev/api/auth/callback/google
   ```
   (Replace with your actual Cloudflare Pages domain)
5. Click **Save**

### Update Authorized JavaScript Origins (if needed)

Add your Cloudflare Pages domain:
```
https://ac-multiposter.pages.dev
```

---

## 5. Database Migration

You need to run database migrations to set up the schema. You have two options:

### Option A: Run Migrations Locally (Recommended)

1. **Temporarily update your local `.env` file** with the production database URL:
   ```env
   DATABASE_URL="postgresql://production-connection-string"
   ```

2. **Run migrations**:
   ```powershell
   pnpm db:migrate
   # or
   pnpm db:push
   ```

3. **Restore your local `.env`** to use your local database

### Option B: Use Database GUI

Most database providers (Neon, Supabase, Railway) provide a SQL editor. Copy and run the migration files from the `drizzle/` directory in order:

1. `0000_tan_chat.sql`
2. `0001_flippant_shotgun.sql`
3. (And so on, in numerical order)

---

## 6. Cloudflare Cron Jobs (Webhook Renewal)

Google Calendar webhooks expire after ~7 days and need renewal. Set up a Cloudflare Cron Trigger:

### Step 1: Create Worker for Cron

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Click your Pages project
3. Go to **Settings** → **Functions**
4. Click **Add Cron Trigger**

### Step 2: Configure Cron Job

Unfortunately, Cloudflare Pages doesn't directly support cron triggers. You have two options:

#### Option A: Use Cloudflare Workers (Recommended)

Create a simple Cloudflare Worker to call your webhook renewal endpoint:

1. Create a new Worker in **Workers & Pages** → **Create application** → **Create Worker**
2. Name it something like `ac-multiposter-cron`
3. Replace the worker code with:

```javascript
export default {
  async scheduled(event, env, ctx) {
    const response = await fetch('https://ac-multiposter.pages.dev/api/sync/renew-webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CRON_SECRET}`
      }
    });
    
    console.log('Webhook renewal response:', response.status);
  },
};
```

4. Go to **Settings** → **Variables and Secrets**
5. Add environment variable: `CRON_SECRET` (same value as in your Pages project)
6. Go to **Triggers** → **Cron Triggers**
7. Click **Add Cron Trigger**
8. Set schedule: `0 0 * * *` (daily at midnight UTC)
9. Click **Save**

#### Option B: Use External Cron Service

Use a service like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- GitHub Actions

Configure it to call:
```bash
curl -X POST https://ac-multiposter.pages.dev/api/sync/renew-webhooks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Schedule: Daily (0 0 * * * in cron syntax)

---

## 7. Testing Your Deployment

### Step 1: Trigger a Deployment

After adding all environment variables:

1. Go to **Deployments** in your Cloudflare Pages project
2. Click **Retry deployment** on the failed deployment
3. Or push a new commit to trigger a fresh deployment

### Step 2: Monitor Build Logs

Watch the build logs to ensure:
- ✅ Dependencies install successfully
- ✅ Build completes without errors
- ✅ Deployment succeeds

### Step 3: Test the Application

1. Visit your Cloudflare Pages URL
2. Click **Sign In** and test Google OAuth
3. Grant yourself admin access (see [Granting Access](#granting-initial-admin-access) below)
4. Test creating events, campaigns, and synchronizations
5. Verify webhook registration works (check logs in Pages Functions)

### Granting Initial Admin Access

After your first sign-in, you need to grant admin access:

1. Connect to your production database using a SQL client
2. Run:
   ```sql
   UPDATE "user"
   SET roles = '["admin"]'
   WHERE email = 'your-email@example.com';
   ```
3. Refresh the app - you should now see all features

---

## 8. Troubleshooting

### "No adapter specified" during build

**Problem:** Build fails with:
- `No adapter specified`
- `Output directory ".svelte-kit/cloudflare" not found.`

**Solution:** Ensure the Cloudflare adapter is configured inside the `kit` block in `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-cloudflare'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter()
  }
}
export default config
```

Then re-run the build (`pnpm build`) and redeploy.

### Build Fails with Node.js Version Error

**Problem:** "Error: The engine "node" is incompatible with this module"

**Solution:** Add environment variable in Cloudflare:
- `NODE_VERSION` = `20`

### Database Connection Errors

**Problem:** "DATABASE_URL is not set" or connection timeout

**Solutions:**
- Verify `DATABASE_URL` is set correctly in environment variables
- Ensure the database allows connections from Cloudflare IPs
- For Neon/Supabase, use connection pooling URL if available
- Check if your database requires SSL (most do)

### OAuth Redirect Errors

**Problem:** "redirect_uri_mismatch" from Google

**Solution:**
- Ensure redirect URI in Google Console exactly matches: `https://your-domain.pages.dev/api/auth/callback/google`
- No trailing slashes
- Must be HTTPS
- Must match your `BETTER_AUTH_URL`

### Webhook Registration Fails

**Problem:** "Bad webhook address" or webhook setup errors

**Solutions:**
- Ensure `BETTER_AUTH_URL` is set to your public Cloudflare Pages domain
- Must be HTTPS
- Domain must be publicly accessible
- Test the webhook endpoint manually: `https://your-domain.pages.dev/api/sync/webhook/google-calendar`

### Functions Timeout

**Problem:** "Worker exceeded CPU time limit"

**Solutions:**
- Cloudflare Pages Functions have a 15-second timeout on free tier
- For long-running syncs, consider breaking them into smaller operations
- Check if database queries are optimized
- Consider upgrading to Workers Paid plan for longer timeouts

### Environment Variables Not Loading

**Problem:** App behaves as if environment variables are missing

**Solutions:**
- Redeploy after adding environment variables
- Check that variables are added to "Production" environment, not "Preview"
- Cloudflare Pages requires redeployment to pick up new environment variables

### Cron Job Not Running

**Problem:** Webhooks not being renewed

**Solutions:**
- Check Worker logs in Cloudflare Dashboard
- Verify `CRON_SECRET` matches between Worker and Pages project
- Test the endpoint manually with curl
- Ensure Worker has the correct URL

---

## Custom Domain (Optional)

To use your own domain:

1. In Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (must be using Cloudflare DNS)
4. Follow the verification steps
5. Update `BETTER_AUTH_URL` to your custom domain
6. Update Google OAuth redirect URI to use custom domain
7. Redeploy

---

## Performance Optimization

### Enable Caching

Cloudflare automatically caches static assets. For API routes:

1. Add appropriate Cache-Control headers in your API routes
2. Use Cloudflare Page Rules for additional caching

### Database Connection Pooling

Use connection pooling for better database performance:
- **Neon**: Use the "Pooled connection" string
- **Supabase**: Use the "Connection pooling" string with port 6543

### Monitoring

Enable Cloudflare Analytics:
1. Go to your Pages project
2. Click **Analytics**
3. View requests, errors, and performance metrics

---

## Rollback Strategy

If a deployment breaks:

1. Go to **Deployments**
2. Find the last working deployment
3. Click **...** → **Rollback to this deployment**
4. Or use **Rollback** button on the failed deployment

---

## Security Best Practices

1. **Never commit** `.env` files to git (already in `.gitignore`)
2. **Rotate secrets** periodically (BETTER_AUTH_SECRET, CRON_SECRET)
3. **Use strong** database passwords
4. **Enable** database SSL connections
5. **Restrict** database access to specific IPs if possible
6. **Monitor** Cloudflare logs for suspicious activity
7. **Keep dependencies** updated: `pnpm update`

---

## Cost Estimate

### Free Tier Limits (as of 2025)

**Cloudflare Pages:**
- Unlimited requests
- 500 builds per month
- 100,000 Functions requests per day
- First 100,000 requests/day are free

**Database Options:**
- **Neon**: 0.5GB storage, 3GB data transfer/month free
- **Supabase**: 500MB database, 1GB bandwidth free

Most small to medium applications stay within free tiers.

---

## Support and Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [SvelteKit Cloudflare Adapter Docs](https://kit.svelte.dev/docs/adapter-cloudflare)
- [Better Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure custom domain (optional)
3. Set up staging environment for testing
4. Enable Cloudflare Web Analytics
5. Configure caching strategies
6. Set up automated backups for your database

Happy deploying! 🚀
