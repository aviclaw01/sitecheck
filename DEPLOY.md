# Deploying SiteCheck to Vercel

## One-Click Deploy (Recommended)

1. Go to **[vercel.com](https://vercel.com)** and sign in (or create a free account)
2. Click **"New Project"**
3. Select **"Import Git Repository"** → find `aviclaw01/sitecheck`
4. Click **"Deploy"** — Vercel auto-detects Next.js and configures everything
5. Your site is live in ~90 seconds! 🎉

## Environment Variables (Optional)

Set these in Vercel → Project Settings → Environment Variables:

| Variable | Description | Example |
|---|---|---|
| `ADMIN_KEY` | Secret key to access `/api/subscribe?adminKey=...` | `nexprove-2024-secret` |
| `NEXT_PUBLIC_BASE_URL` | Your production URL for sitemap | `https://sitecheck.nexprove.com` |

## Custom Domain

1. Vercel dashboard → your project → **Settings → Domains**
2. Add your domain (e.g. `sitecheck.nexprove.com`)
3. Add the CNAME record to your DNS provider
4. HTTPS is automatic via Let's Encrypt

---

## GitHub Actions (Automated Deploy on Push)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Required GitHub Secrets

Add these in GitHub → repo → **Settings → Secrets → Actions**:

| Secret | How to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Run `vercel link` locally, then check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same `.vercel/project.json` after `vercel link` |

---

## Data / Leads

When deployed to Vercel (serverless), the `data/leads.json` file **will not persist** between deployments.

**For production, replace the file storage with:**
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv) (Redis, built-in)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase](https://supabase.com) (free tier, Postgres)
- Any external database with a connection string in env vars

For now (early-stage), the file backup works fine on a persistent VPS/server.

---

## Testing Before Deploy

```bash
cd /path/to/sitecheck
npm run build    # Must pass with 0 errors
npm start        # Test production build locally at http://localhost:3000
```
