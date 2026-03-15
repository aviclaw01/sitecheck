# SiteCheck — Free Website Audit for German Auto Dealers

**[sitecheck.nexprove.com](https://sitecheck.nexprove.com)**

SiteCheck instantly audits dealership websites across 6 key dimensions and generates a detailed action plan. Built to generate leads for [Nexprove](https://www.nexprove.com).

---

## What It Does

Enter any website URL → get a detailed audit report in ~15 seconds:

- **Mobile Responsiveness** — viewport meta, responsive CSS
- **Page Speed** — load time analysis with recommendations
- **SEO Basics** — title, description, H1, Open Graph, og:image, robots.txt, sitemap
- **Local Search Presence** — schema markup, address, phone, Google Maps
- **Inventory & Booking Features** — vehicle listings, test drive booking, WhatsApp, live chat
- **Trust & Security** — HTTPS, favicon, analytics, DSGVO cookie consent, security headers

Plus:
- ⚡ **Quick Wins** — top 5 high-impact fixes ranked by priority
- 🔴 **Missing Elements** — complete checklist of what's absent
- 📊 **Competitor Benchmark** — how you compare to the industry average
- 🔬 **Technical Scan** — 12-point checklist with pass/fail badges
- 📧 **Lead capture** — email CTA with inline success state

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Deploy | Vercel |
| Data | JSON file (leads.json) |
| Runtime | Node.js (Edge-compatible) |

---

## Local Development

```bash
git clone https://github.com/aviclaw01/sitecheck
cd sitecheck
npm install
npm run dev
# → http://localhost:3000
```

### Build for production

```bash
npm run build
npm start
```

---

## API Endpoints

### `POST /api/audit`

Audits a website URL and returns a detailed report.

**Request:**
```json
{ "url": "https://www.example-autohaus.de" }
```

**Response:**
```json
{
  "url": "https://www.example-autohaus.de",
  "overallScore": 54,
  "overallGrade": "D",
  "scores": [...],
  "quickWins": [...],
  "missingElements": [...],
  "competitorBenchmark": {...},
  "technicalDetails": {...}
}
```

### `POST /api/subscribe`

Captures a lead (email + audit data).

**Request:**
```json
{ "email": "dealer@example.de", "url": "https://...", "score": 54, "grade": "D" }
```

### `GET /api/subscribe`

Download all leads (requires `Authorization: Bearer <ADMIN_KEY>` header).

---

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for full Vercel + GitHub Actions instructions.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ADMIN_KEY` | `nexprove-admin` | Bearer token for leads export |
| `NEXT_PUBLIC_BASE_URL` | `https://sitecheck.nexprove.com` | Base URL for sitemap |

---

## Project Structure

```
sitecheck/
├── app/
│   ├── api/
│   │   ├── audit/route.ts      # Main audit engine
│   │   └── subscribe/route.ts  # Lead capture
│   ├── results/page.tsx        # Results page
│   ├── sitemap.ts              # Dynamic sitemap
│   ├── layout.tsx
│   └── page.tsx                # Landing page
├── data/
│   └── leads.json              # Captured leads
├── public/
│   └── robots.txt
├── DEPLOY.md
└── README.md
```

---

## Built By

[Nexprove](https://www.nexprove.com) — Premium Product Development Studio  
From MVP to Scale · React · Next.js · Tailwind · Supabase
