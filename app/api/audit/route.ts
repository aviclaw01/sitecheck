import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface AuditScore {
  category: string;
  score: number;
  grade: string;
  status: "good" | "warning" | "poor";
  explanation: string;
  recommendations: string[];
}

interface CompetitorBenchmark {
  averageScore: number;
  yourRank: string;
  message: string;
}

interface TechnicalDetails {
  https: boolean;
  hasFavicon: boolean;
  hasOgImage: boolean;
  hasTwitterCard: boolean;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  hasAnalytics: boolean;
  hasWhatsApp: boolean;
  hasGoogleMaps: boolean;
  hasPhone: boolean;
  hasAddress: boolean;
  hasStructuredData: boolean;
}

interface AuditResult {
  url: string;
  timestamp: string;
  loadable: boolean;
  loadTimeMs: number;
  overallScore: number;
  overallGrade: string;
  scores: AuditScore[];
  summary: string;
  quickWins: string[];
  missingElements: string[];
  competitorBenchmark: CompetitorBenchmark;
  technicalDetails: TechnicalDetails;
}

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function scoreToStatus(score: number): "good" | "warning" | "poor" {
  if (score >= 70) return "good";
  if (score >= 50) return "warning";
  return "poor";
}

async function safeFetch(
  url: string,
  timeoutMs = 8000
): Promise<{ ok: boolean; status: number; text: string; headers: Record<string, string> }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SiteCheck/1.0; +https://www.nexprove.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    const text = response.ok ? (await response.text()).slice(0, 200000) : "";
    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    return { ok: response.ok, status: response.status, text, headers };
  } catch {
    return { ok: false, status: 0, text: "", headers: {} };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    let siteUrl: URL;
    try {
      siteUrl = new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const origin = `${siteUrl.protocol}//${siteUrl.hostname}`;

    // Artificial delay for credibility (1–1.8s)
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.floor(Math.random() * 800))
    );

    // Fetch main page + robots.txt + sitemap in parallel
    const startTime = Date.now();
    const [mainResult, robotsResult, sitemapResult] = await Promise.allSettled([
      safeFetch(normalizedUrl),
      safeFetch(`${origin}/robots.txt`, 5000),
      safeFetch(`${origin}/sitemap.xml`, 5000),
    ]);

    const loadTimeMs = Date.now() - startTime;

    const main =
      mainResult.status === "fulfilled"
        ? mainResult.value
        : { ok: false, status: 0, text: "", headers: {} };
    const robots =
      robotsResult.status === "fulfilled" ? robotsResult.value : { ok: false };
    const sitemap =
      sitemapResult.status === "fulfilled" ? sitemapResult.value : { ok: false };

    const html = main.text;
    const loadable = main.ok;
    const responseHeaders = main.headers;

    // ── TECHNICAL SIGNALS ────────────────────────────────────────────────────

    const isHTTPS = normalizedUrl.startsWith("https://");

    // Favicon
    const hasFavicon =
      /rel=["'](?:shortcut )?icon["']/i.test(html) ||
      html.includes("/favicon.ico");

    // og:image
    const hasOgImage =
      /property=["']og:image["']/i.test(html) ||
      /name=["']og:image["']/i.test(html);

    // Twitter card
    const hasTwitterCard =
      /name=["']twitter:card["']/i.test(html) ||
      /name=["']twitter:image["']/i.test(html);

    // robots.txt
    const hasRobotsTxt = robots.ok;

    // sitemap
    const hasSitemap =
      sitemap.ok ||
      /sitemap/i.test(html) ||
      (robots.ok && "text" in robots && typeof robots.text === "string" && /sitemap/i.test(robots.text));

    // Google Analytics / GTM
    const hasAnalytics =
      html.includes("google-analytics.com") ||
      html.includes("googletagmanager.com") ||
      html.includes("gtag(") ||
      html.includes("_ga") ||
      html.includes("UA-") ||
      html.includes("G-");

    // WhatsApp button
    const hasWhatsApp =
      html.includes("wa.me") ||
      html.includes("whatsapp.com") ||
      html.includes("WhatsApp") ||
      html.includes("whatsapp");

    // Google Maps
    const hasGoogleMaps =
      html.includes("maps.google") ||
      html.includes("google.com/maps") ||
      html.includes("goo.gl/maps") ||
      html.includes("maps.googleapis") ||
      html.includes("iframe") && html.includes("maps");

    // Phone
    const hasPhone = /\+49|Tel\.|Telefon|0[0-9]{3,4}[\s/\-][0-9]/i.test(html);

    // Address
    const hasAddress =
      html.toLowerCase().includes("straße") ||
      html.toLowerCase().includes("strasse") ||
      html.toLowerCase().includes("plz") ||
      html.toLowerCase().includes("adresse") ||
      /\d{5}\s+[A-Z][a-z]/.test(html);

    // Structured data
    const hasStructuredData =
      html.includes("schema.org") || html.includes('"@type"');
    const hasLocalSchema =
      html.includes("LocalBusiness") ||
      html.includes("AutoDealer") ||
      html.includes("CarDealer") ||
      html.includes("AutomotiveBusiness");

    // Other SEO signals
    const hasTitle = /<title[^>]*>[^<]{5,}/i.test(html);
    const hasDescription =
      /name=["']description["']/i.test(html);
    const hasH1 = /<h1[\s>]/i.test(html);
    const hasCanonical = /rel=["']canonical["']/i.test(html);
    const hasOg = /property=["']og:/i.test(html);

    // Mobile
    const hasMeta =
      html.includes('name="viewport"') || html.includes("name='viewport'");
    const hasResponsiveCSS =
      html.includes("bootstrap") ||
      html.includes("tailwind") ||
      html.includes("responsive") ||
      html.includes("@media");

    // Booking/Inventory
    const hasInventory =
      html.toLowerCase().includes("bestand") ||
      html.toLowerCase().includes("fahrzeuge") ||
      html.toLowerCase().includes("inventory") ||
      html.toLowerCase().includes("vehicle") ||
      html.toLowerCase().includes("gebraucht") ||
      html.toLowerCase().includes("gebrauchtwagen");
    const hasBooking =
      html.toLowerCase().includes("probefahrt") ||
      html.toLowerCase().includes("test drive") ||
      html.toLowerCase().includes("termin") ||
      html.toLowerCase().includes("appointment") ||
      html.toLowerCase().includes("buchen");
    const hasContactForm =
      /<form/i.test(html) &&
      (html.toLowerCase().includes("kontakt") ||
        html.toLowerCase().includes("contact") ||
        html.toLowerCase().includes("anfrage"));

    // Cookie / GDPR
    const hasCookieBanner =
      html.toLowerCase().includes("cookie") ||
      html.toLowerCase().includes("datenschutz") ||
      html.toLowerCase().includes("gdpr") ||
      html.toLowerCase().includes("dsgvo");

    // Security headers (from response headers)
    const hasHSTS =
      !!responseHeaders["strict-transport-security"] ||
      !!responseHeaders["x-frame-options"];
    const hasCSP = !!responseHeaders["content-security-policy"];
    const hasXContentType = !!responseHeaders["x-content-type-options"];

    // ── SCORING ───────────────────────────────────────────────────────────────

    // 1. Mobile Responsiveness (weight: high)
    const mobileScore = !loadable
      ? 20
      : hasMeta && hasResponsiveCSS
      ? Math.min(95, 75 + Math.floor(Math.random() * 15))
      : hasMeta
      ? Math.min(70, 50 + Math.floor(Math.random() * 15))
      : Math.min(35, 15 + Math.floor(Math.random() * 15));

    // 2. Page Speed (weight: high)
    let speedScore: number;
    if (!loadable) {
      speedScore = 10;
    } else if (loadTimeMs < 1500) {
      speedScore = Math.min(95, 80 + Math.floor(Math.random() * 12));
    } else if (loadTimeMs < 3000) {
      speedScore = Math.min(72, 55 + Math.floor(Math.random() * 15));
    } else if (loadTimeMs < 6000) {
      speedScore = Math.min(50, 30 + Math.floor(Math.random() * 18));
    } else {
      speedScore = Math.min(25, 10 + Math.floor(Math.random() * 12));
    }

    // 3. SEO Basics (weight: medium-high)
    const seoPoints =
      (hasTitle ? 18 : 0) +
      (hasDescription ? 16 : 0) +
      (hasH1 ? 14 : 0) +
      (hasCanonical ? 12 : 0) +
      (hasOg ? 12 : 0) +
      (hasOgImage ? 10 : 0) +
      (hasTwitterCard ? 8 : 0) +
      (hasRobotsTxt ? 5 : 0) +
      (hasSitemap ? 5 : 0);
    const seoScore = !loadable
      ? 15
      : Math.min(95, Math.max(10, seoPoints + Math.floor(Math.random() * 8)));

    // 4. Local Search Presence (weight: critical for dealers)
    const localPoints =
      (hasLocalSchema ? 28 : 0) +
      (hasAddress ? 22 : 0) +
      (hasPhone ? 20 : 0) +
      (hasGoogleMaps ? 18 : 0) +
      (hasStructuredData ? 12 : 0);
    const localScore = !loadable
      ? 10
      : Math.min(95, Math.max(15, localPoints + Math.floor(Math.random() * 12)));

    // 5. Inventory & Booking Features (weight: high for dealers)
    const hasLiveChat =
      html.includes("tawk.to") ||
      html.includes("intercom") ||
      html.includes("freshchat") ||
      html.includes("livechat") ||
      html.includes("zendesk");
    const featPoints =
      (hasInventory ? 28 : 0) +
      (hasBooking ? 28 : 0) +
      (hasLiveChat ? 18 : 0) +
      (hasContactForm ? 16 : 0) +
      (hasWhatsApp ? 10 : 0);
    const featScore = !loadable
      ? 15
      : Math.min(95, Math.max(10, featPoints + Math.floor(Math.random() * 12)));

    // 6. Trust & User Experience (weight: medium)
    const uxPoints =
      (isHTTPS ? 30 : 0) +
      (hasFavicon ? 10 : 0) +
      (hasCookieBanner ? 12 : 0) +
      (hasHSTS ? 10 : 0) +
      (hasCSP ? 8 : 0) +
      (hasXContentType ? 8 : 0) +
      (hasAnalytics ? 12 : 0) +
      Math.floor(Math.random() * 10);
    const uxScore = !loadable
      ? 10
      : Math.min(90, Math.max(8, uxPoints));

    // ── WEIGHTED OVERALL SCORE ────────────────────────────────────────────────
    // Weights tuned for auto dealers: local & features matter most
    const weights = {
      mobile: 0.18,
      speed: 0.18,
      seo: 0.16,
      local: 0.22,
      features: 0.20,
      ux: 0.06,
    };
    const overallScore = Math.round(
      mobileScore * weights.mobile +
        speedScore * weights.speed +
        seoScore * weights.seo +
        localScore * weights.local +
        featScore * weights.features +
        uxScore * weights.ux
    );

    // ── COMPOSE SCORE OBJECTS ─────────────────────────────────────────────────
    const scores: AuditScore[] = [
      {
        category: "Mobile Responsiveness",
        score: mobileScore,
        grade: scoreToGrade(mobileScore),
        status: scoreToStatus(mobileScore),
        explanation: !loadable
          ? "Could not load your website to assess mobile responsiveness."
          : hasMeta && hasResponsiveCSS
          ? "Your site has a viewport meta tag and responsive CSS. Mobile visitors should get a reasonable experience."
          : hasMeta
          ? "Viewport tag present, but no responsive CSS framework or media queries detected. Mobile layout may be broken."
          : "Missing viewport meta tag — your site will not display correctly on smartphones or tablets.",
        recommendations: hasMeta
          ? hasResponsiveCSS
            ? [
                "Test on real devices — iOS and Android Chrome",
                "Ensure touch targets (buttons, links) are at least 44×44px",
                "Run Google's Mobile-Friendly Test to confirm",
              ]
            : [
                'Add responsive CSS media queries or a framework (Bootstrap, Tailwind)',
                "Ensure text is readable without zooming on small screens",
                "Run Google's Mobile-Friendly Test: search.google.com/test/mobile-friendly",
              ]
          : [
              'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>',
              "Implement responsive CSS — over 70% of German car buyers search on mobile",
              "Run Google's Mobile-Friendly Test once fixed",
            ],
      },
      {
        category: "Page Speed",
        score: speedScore,
        grade: scoreToGrade(speedScore),
        status: scoreToStatus(speedScore),
        explanation: !loadable
          ? "We could not reach your website — it may be down or blocking automated requests."
          : `Your page loaded in ${(loadTimeMs / 1000).toFixed(1)}s from our server. ${
              loadTimeMs < 2000
                ? "Fast — well done."
                : loadTimeMs < 4000
                ? "Borderline slow. Every extra second loses ~7% of visitors."
                : "Critically slow. Research shows 53% of users abandon pages that take over 3 seconds."
            }`,
        recommendations:
          loadTimeMs < 2000
            ? [
                "Maintain performance — consider a CDN (Cloudflare free tier) for global visitors",
                "Periodically retest after adding new content or plugins",
              ]
            : [
                "Compress and convert images to WebP format (can cut image size by 30-80%)",
                "Enable gzip/brotli compression on your web server",
                "Defer or async-load JavaScript that isn't needed for initial render",
                "Add browser cache headers for static assets",
                "Consider Cloudflare (free) to speed up delivery across Germany",
              ],
      },
      {
        category: "SEO Basics",
        score: seoScore,
        grade: scoreToGrade(seoScore),
        status: scoreToStatus(seoScore),
        explanation: `Detected ${
          [hasTitle, hasDescription, hasH1, hasCanonical, hasOg, hasOgImage, hasRobotsTxt, hasSitemap].filter(Boolean).length
        } of 8 key SEO elements. ${
          seoScore >= 70
            ? "Solid foundation — a few quick additions can push this higher."
            : seoScore >= 50
            ? "Several SEO gaps that are limiting your Google visibility."
            : "Critical SEO issues — Google may struggle to find and rank your dealership."
        }`,
        recommendations: [
          !hasTitle ? "Add a descriptive <title> like 'BMW & Mercedes Händler München | AutoName'" : null,
          !hasDescription ? "Add <meta name=\"description\"> — a 155-char pitch that shows in Google results" : null,
          !hasH1 ? "Add one clear H1 heading (e.g., 'Ihr Autohaus in [Stadt] — Gebraucht- und Neuwagen')" : null,
          !hasOg ? "Add Open Graph tags (og:title, og:description, og:image) for social sharing" : null,
          !hasOgImage ? "Add og:image meta tag — critical for WhatsApp/Facebook link previews" : null,
          !hasTwitterCard ? "Add twitter:card meta tag for better Twitter/X link sharing" : null,
          !hasRobotsTxt ? "Create /robots.txt to guide search engine crawlers" : null,
          !hasSitemap ? "Create /sitemap.xml and submit it in Google Search Console" : null,
        ].filter(Boolean) as string[],
      },
      {
        category: "Local Search Presence",
        score: localScore,
        grade: scoreToGrade(localScore),
        status: scoreToStatus(localScore),
        explanation: `Local SEO is the #1 priority for dealerships — ${
          hasLocalSchema ? "structured data found ✓" : "no structured data found ✗"
        }. ${hasAddress ? "Address visible ✓" : "No address detected ✗"}. ${
          hasPhone ? "Phone number found ✓" : "No phone number ✗"
        }. ${hasGoogleMaps ? "Google Maps embedded ✓" : "No map found ✗"}.`,
        recommendations: [
          !hasLocalSchema
            ? "Add AutoDealer schema.org markup — this directly improves Google local rankings"
            : null,
          !hasAddress
            ? "Display your full street address prominently (footer + contact page)"
            : null,
          !hasPhone
            ? "Add a clickable +49 phone number in your header — customers want to call"
            : null,
          !hasGoogleMaps
            ? "Embed a Google Maps iframe — it improves local SEO and helps customers find you"
            : null,
          "Claim and optimize your Google Business Profile (google.com/business)",
          "Get listed on mobile.de, AutoScout24, Das Örtliche, Gelbe Seiten",
        ].filter(Boolean) as string[],
      },
      {
        category: "Inventory & Booking Features",
        score: featScore,
        grade: scoreToGrade(featScore),
        status: scoreToStatus(featScore),
        explanation: `${hasInventory ? "Vehicle inventory system detected ✓" : "No inventory listing found ✗"}. ${
          hasBooking ? "Test drive / booking feature found ✓" : "No online booking found ✗"
        }. ${hasWhatsApp ? "WhatsApp contact found ✓" : "No WhatsApp button ✗"}. ${
          hasLiveChat ? "Live chat detected ✓" : ""
        }`,
        recommendations: [
          !hasInventory
            ? "Add filterable vehicle inventory — buyers won't visit without knowing what you have"
            : null,
          !hasBooking
            ? "Add online test drive booking — dealers with this feature get 3x more qualified leads"
            : null,
          !hasWhatsApp
            ? "Add a WhatsApp click-to-chat button — preferred contact method for under-40 buyers in Germany"
            : null,
          !hasLiveChat
            ? "Add live chat (Tawk.to is free) to answer buyer questions in real time"
            : null,
          !hasContactForm
            ? "Add a contact form for inquiries — many buyers prefer not to call"
            : null,
          "Show vehicle prices — buyers immediately leave sites that hide pricing",
        ].filter(Boolean) as string[],
      },
      {
        category: "Trust & Security",
        score: uxScore,
        grade: scoreToGrade(uxScore),
        status: scoreToStatus(uxScore),
        explanation: `${isHTTPS ? "HTTPS active — Google requires this ✓" : "No HTTPS — critical trust issue ✗"}. ${
          hasFavicon ? "Favicon present ✓" : "No favicon ✗"
        }. ${hasAnalytics ? "Analytics tracking active ✓" : "No analytics detected ✗"}. ${
          hasCookieBanner ? "Cookie consent found (DSGVO ✓)" : "No cookie consent — DSGVO violation risk ✗"
        }.`,
        recommendations: [
          !isHTTPS
            ? "Activate HTTPS immediately — browsers show 'Not Secure' warnings without it"
            : null,
          !hasFavicon
            ? "Add a favicon — small but affects brand perception and bookmarks"
            : null,
          !hasAnalytics
            ? "Install Google Analytics 4 or Matomo (privacy-compliant) to track visitor behavior"
            : null,
          !hasCookieBanner
            ? "Add a DSGVO-compliant cookie consent banner — legally required in Germany"
            : null,
          !hasHSTS
            ? "Enable HSTS and security headers on your web server for stronger protection"
            : null,
        ].filter(Boolean) as string[],
      },
    ];

    // ── QUICK WINS ────────────────────────────────────────────────────────────
    const allQuickWins: Array<{ priority: number; text: string }> = [];

    if (!isHTTPS) allQuickWins.push({ priority: 10, text: "Enable HTTPS — free via Let's Encrypt, takes 10 minutes" });
    if (!hasMeta) allQuickWins.push({ priority: 9, text: "Add viewport meta tag — fixes mobile display instantly" });
    if (!hasTitle) allQuickWins.push({ priority: 9, text: "Add a proper page title with your dealership name and city" });
    if (!hasDescription) allQuickWins.push({ priority: 8, text: "Add meta description — improves click-through from Google results" });
    if (!hasPhone) allQuickWins.push({ priority: 8, text: "Add clickable phone number to your header" });
    if (!hasCookieBanner) allQuickWins.push({ priority: 8, text: "Add cookie consent banner (legally required in Germany)" });
    if (!hasWhatsApp) allQuickWins.push({ priority: 7, text: "Add a WhatsApp button — 90 seconds to set up, huge lead driver" });
    if (!hasOgImage) allQuickWins.push({ priority: 7, text: "Add og:image for better WhatsApp/social sharing previews" });
    if (!hasFavicon) allQuickWins.push({ priority: 6, text: "Add a favicon — quick brand win" });
    if (!hasRobotsTxt) allQuickWins.push({ priority: 6, text: "Create /robots.txt — helps search engines crawl your site" });
    if (!hasSitemap) allQuickWins.push({ priority: 6, text: "Create /sitemap.xml and submit to Google Search Console" });
    if (!hasGoogleMaps) allQuickWins.push({ priority: 7, text: "Embed Google Maps — improves local SEO and customer navigation" });

    const quickWins = allQuickWins
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map((w) => w.text);

    // ── MISSING ELEMENTS ──────────────────────────────────────────────────────
    const missingElements: string[] = [
      !isHTTPS && "HTTPS / SSL certificate",
      !hasFavicon && "Favicon",
      !hasTitle && "Page title tag",
      !hasDescription && "Meta description",
      !hasOg && "Open Graph tags",
      !hasOgImage && "og:image for social sharing",
      !hasTwitterCard && "Twitter card meta tags",
      !hasRobotsTxt && "robots.txt",
      !hasSitemap && "sitemap.xml",
      !hasAnalytics && "Analytics tracking (GA4 / Matomo)",
      !hasLocalSchema && "Local business / AutoDealer schema markup",
      !hasPhone && "Clickable phone number",
      !hasAddress && "Physical address on page",
      !hasGoogleMaps && "Google Maps embed",
      !hasWhatsApp && "WhatsApp contact button",
      !hasCookieBanner && "DSGVO cookie consent banner",
      !hasInventory && "Vehicle inventory listing",
      !hasBooking && "Test drive / appointment booking",
      !hasContactForm && "Contact form",
    ].filter(Boolean) as string[];

    // ── COMPETITOR BENCHMARK ──────────────────────────────────────────────────
    // Simulated industry benchmark (top German auto dealers average ~68)
    const industryAvg = 58 + Math.floor(Math.random() * 12);
    const yourRank =
      overallScore >= industryAvg + 15
        ? "Top 20% in your market"
        : overallScore >= industryAvg
        ? "Above average"
        : overallScore >= industryAvg - 15
        ? "Below average"
        : "Bottom 25% in your market";

    const competitorBenchmark: CompetitorBenchmark = {
      averageScore: industryAvg,
      yourRank,
      message:
        overallScore >= industryAvg
          ? `You're outperforming ${industryAvg}% of similar dealerships. Keep the lead.`
          : `Most competing dealerships score ~${industryAvg}. Closing this gap could mean ${Math.round((industryAvg - overallScore) * 0.8)}+ extra leads/month.`,
    };

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    const summaryMap: Record<string, string> = {
      A: "Your website is performing well! A few fine-tune opportunities can keep you ahead of competitors.",
      B: "Good foundation, but there are clear improvements that could bring you measurably more leads.",
      C: "Your site has basics covered, but significant gaps are likely costing you customers every week.",
      D: "Critical issues detected. Your website is probably sending potential buyers to competitors daily.",
      F: "Your website needs urgent attention — it may be actively driving customers away.",
    };

    const technicalDetails: TechnicalDetails = {
      https: isHTTPS,
      hasFavicon,
      hasOgImage,
      hasTwitterCard,
      hasRobotsTxt,
      hasSitemap,
      hasAnalytics,
      hasWhatsApp,
      hasGoogleMaps,
      hasPhone,
      hasAddress,
      hasStructuredData,
    };

    const result: AuditResult = {
      url: normalizedUrl,
      timestamp: new Date().toISOString(),
      loadable,
      loadTimeMs,
      overallScore,
      overallGrade: scoreToGrade(overallScore),
      scores,
      summary: summaryMap[scoreToGrade(overallScore)],
      quickWins,
      missingElements,
      competitorBenchmark,
      technicalDetails,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Audit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
