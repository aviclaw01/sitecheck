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

interface AuditResult {
  url: string;
  timestamp: string;
  loadable: boolean;
  loadTimeMs: number;
  overallScore: number;
  overallGrade: string;
  scores: AuditScore[];
  summary: string;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Normalize URL
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

    const hostname = siteUrl.hostname.toLowerCase();

    // Attempt to fetch the site
    let html = "";
    let loadable = false;
    let loadTimeMs = 0;
    let statusCode = 0;

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SiteCheck/1.0; +https://www.nexprove.com)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        },
        redirect: "follow",
      });

      clearTimeout(timeout);
      loadTimeMs = Date.now() - startTime;
      statusCode = response.status;
      loadable = response.ok;

      if (response.ok) {
        const text = await response.text();
        html = text.slice(0, 200000); // Cap at 200KB for analysis
      }
    } catch {
      loadable = false;
      loadTimeMs = 10000;
    }

    // ── SCORING ──────────────────────────────────────────────────────────────

    // 1. Mobile Responsiveness
    const hasMeta = html.includes('name="viewport"') || html.includes("name='viewport'");
    const hasResponsiveClass =
      html.includes("bootstrap") ||
      html.includes("tailwind") ||
      html.includes("responsive") ||
      html.includes("@media");
    const mobileScore = !loadable
      ? 20
      : hasMeta && hasResponsiveClass
      ? Math.floor(Math.random() * 15) + 75
      : hasMeta
      ? Math.floor(Math.random() * 20) + 50
      : Math.floor(Math.random() * 20) + 20;

    // 2. Page Speed
    let speedScore: number;
    if (!loadable) {
      speedScore = 10;
    } else if (loadTimeMs < 1500) {
      speedScore = Math.floor(Math.random() * 15) + 80;
    } else if (loadTimeMs < 3000) {
      speedScore = Math.floor(Math.random() * 20) + 55;
    } else if (loadTimeMs < 6000) {
      speedScore = Math.floor(Math.random() * 20) + 35;
    } else {
      speedScore = Math.floor(Math.random() * 20) + 10;
    }

    // 3. SEO Basics
    const hasTitle = /<title[^>]*>[^<]{5,}/i.test(html);
    const hasDescription =
      /name=["']description["']/i.test(html) ||
      /name="description"/i.test(html);
    const hasH1 = /<h1[\s>]/i.test(html);
    const hasCanonical = /rel=["']canonical["']/i.test(html);
    const hasOg = /property=["']og:/i.test(html);
    const hasStructuredData = html.includes("schema.org") || html.includes('"@type"');
    const seoPoints =
      (hasTitle ? 20 : 0) +
      (hasDescription ? 20 : 0) +
      (hasH1 ? 20 : 0) +
      (hasCanonical ? 15 : 0) +
      (hasOg ? 15 : 0) +
      (hasStructuredData ? 10 : 0);
    const seoScore = !loadable
      ? 15
      : Math.min(95, seoPoints + Math.floor(Math.random() * 10));

    // 4. Local Search Presence
    const hasLocalSchema =
      html.includes("LocalBusiness") ||
      html.includes("AutoDealer") ||
      html.includes("CarDealer");
    const hasAddress =
      html.toLowerCase().includes("straße") ||
      html.toLowerCase().includes("strasse") ||
      html.toLowerCase().includes("plz") ||
      html.toLowerCase().includes("adresse") ||
      /\d{5}\s+[A-Z]/.test(html);
    const hasPhone =
      /\+49|Tel\.|Telefon|0[0-9]{3,4}[\/\s-][0-9]/i.test(html);
    const hasGoogleMaps =
      html.includes("maps.google") ||
      html.includes("google.com/maps") ||
      html.includes("goo.gl/maps");
    const localPoints =
      (hasLocalSchema ? 30 : 0) +
      (hasAddress ? 25 : 0) +
      (hasPhone ? 25 : 0) +
      (hasGoogleMaps ? 20 : 0);
    const localScore = !loadable
      ? 10
      : Math.min(95, Math.max(15, localPoints + Math.floor(Math.random() * 15)));

    // 5. Inventory / Booking Features
    const hasInventory =
      html.toLowerCase().includes("bestand") ||
      html.toLowerCase().includes("fahrzeuge") ||
      html.toLowerCase().includes("inventory") ||
      html.toLowerCase().includes("vehicle") ||
      html.toLowerCase().includes("gebraucht");
    const hasBooking =
      html.toLowerCase().includes("probefahrt") ||
      html.toLowerCase().includes("test drive") ||
      html.toLowerCase().includes("termin") ||
      html.toLowerCase().includes("appointment") ||
      html.toLowerCase().includes("buchen");
    const hasChat =
      html.includes("livechat") ||
      html.includes("tawk.to") ||
      html.includes("intercom") ||
      html.includes("freshchat") ||
      html.includes("zendesk");
    const hasContactForm =
      html.toLowerCase().includes('<form') &&
      (html.toLowerCase().includes("contact") ||
        html.toLowerCase().includes("kontakt"));
    const featPoints =
      (hasInventory ? 30 : 0) +
      (hasBooking ? 30 : 0) +
      (hasChat ? 20 : 0) +
      (hasContactForm ? 20 : 0);
    const featScore = !loadable
      ? 15
      : Math.min(95, Math.max(10, featPoints + Math.floor(Math.random() * 15)));

    // 6. User Experience
    const hasHTTPS = normalizedUrl.startsWith("https://");
    const hasModernFont =
      html.includes("fonts.googleapis.com") ||
      html.includes("font-display") ||
      html.includes("typekit");
    const hasCookieBanner =
      html.toLowerCase().includes("cookie") ||
      html.toLowerCase().includes("datenschutz");
    const uxBase = hasHTTPS ? 35 : 10;
    const uxExtra =
      (hasModernFont ? 15 : 0) +
      (hasCookieBanner ? 10 : 0) +
      Math.floor(Math.random() * 20) +
      15;
    const uxScore = !loadable ? 10 : Math.min(90, uxBase + uxExtra);

    // Compose score objects
    const scores: AuditScore[] = [
      {
        category: "Mobile Responsiveness",
        score: mobileScore,
        grade: scoreToGrade(mobileScore),
        status: scoreToStatus(mobileScore),
        explanation: hasMeta
          ? "Your site has a viewport meta tag, which is a good start for mobile devices."
          : "Your site is missing the viewport meta tag — this means it will not display correctly on mobile phones.",
        recommendations: hasMeta
          ? hasResponsiveClass
            ? ["Consider testing on multiple device sizes", "Ensure tap targets are at least 44×44px"]
            : ["Add responsive CSS media queries for better mobile layout", "Test with Google Mobile-Friendly Test"]
          : [
              "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to your HTML",
              "Implement a responsive layout using CSS media queries or a framework",
              "Test on real mobile devices",
            ],
      },
      {
        category: "Page Speed",
        score: speedScore,
        grade: scoreToGrade(speedScore),
        status: scoreToStatus(speedScore),
        explanation: !loadable
          ? "We could not reach your website within the timeout. This is a critical issue."
          : `Your page loaded in ${(loadTimeMs / 1000).toFixed(1)}s. ${loadTimeMs < 2000 ? "Good performance!" : loadTimeMs < 4000 ? "This is borderline — users notice delays over 2 seconds." : "This is too slow — users abandon pages that take over 3 seconds."}`,
        recommendations:
          loadTimeMs < 2000
            ? ["Maintain current performance", "Consider implementing a CDN for global users"]
            : [
                "Compress and optimize images (use WebP format)",
                "Enable server-side gzip/brotli compression",
                "Minimize and defer JavaScript files",
                "Use browser caching headers",
                "Consider a CDN (Cloudflare free tier works well)",
              ],
      },
      {
        category: "SEO Basics",
        score: seoScore,
        grade: scoreToGrade(seoScore),
        status: scoreToStatus(seoScore),
        explanation: `Your site has ${[hasTitle, hasDescription, hasH1, hasCanonical, hasOg].filter(Boolean).length} of 5 key SEO elements. ${seoScore >= 70 ? "Good foundation." : "There are critical gaps that hurt your Google ranking."}`,
        recommendations: [
          !hasTitle ? "Add a descriptive <title> tag with your business name and city" : null,
          !hasDescription ? "Add a <meta name=\"description\"> with a compelling 155-character summary" : null,
          !hasH1 ? "Add a single H1 heading that includes your main keyword" : null,
          !hasStructuredData ? "Add schema.org structured data for your business (LocalBusiness / AutoDealer)" : null,
          !hasOg ? "Add Open Graph meta tags for better social media sharing" : null,
        ].filter(Boolean) as string[],
      },
      {
        category: "Local Search Presence",
        score: localScore,
        grade: scoreToGrade(localScore),
        status: scoreToStatus(localScore),
        explanation: `Local search is critical for dealerships and logistics. ${hasLocalSchema ? "You have structured data for local business." : "You're missing local schema markup."} ${hasAddress ? "Address info found." : "No address detected on the page."}`,
        recommendations: [
          !hasLocalSchema ? "Add AutoDealer or LocalBusiness schema.org markup" : null,
          !hasAddress ? "Display your full address prominently on every page" : null,
          !hasPhone ? "Add a clickable phone number in the header" : null,
          !hasGoogleMaps ? "Embed a Google Maps widget showing your location" : null,
          "Ensure your Google Business Profile is claimed and up to date",
          "Build local citations on relevant German directories (Das Örtliche, Gelbe Seiten)",
        ].filter(Boolean) as string[],
      },
      {
        category: "Inventory & Booking Features",
        score: featScore,
        grade: scoreToGrade(featScore),
        status: scoreToStatus(featScore),
        explanation: `${hasInventory ? "Vehicle inventory detected." : "No inventory system detected."} ${hasBooking ? "Test drive/appointment booking found." : "No booking functionality found."} ${hasChat ? "Live chat detected." : ""}`,
        recommendations: [
          !hasInventory ? "Add an online inventory listing with filtering by make, model, price" : null,
          !hasBooking ? "Implement online test drive booking or appointment scheduling" : null,
          !hasChat ? "Add live chat (Tawk.to is free) to answer buyer questions instantly" : null,
          !hasContactForm ? "Add a contact form so buyers can inquire about vehicles" : null,
          "Show vehicle pricing prominently — buyers leave when prices are hidden",
        ].filter(Boolean) as string[],
      },
      {
        category: "User Experience",
        score: uxScore,
        grade: scoreToGrade(uxScore),
        status: scoreToStatus(uxScore),
        explanation: `${hasHTTPS ? "HTTPS is active — good for trust and SEO." : "Site is not using HTTPS — this is a critical trust issue."} ${hasCookieBanner ? "Cookie consent detected (important for German law)." : "No cookie consent banner found."}`,
        recommendations: [
          !hasHTTPS ? "Enable HTTPS immediately — it's required for trust and Google ranking" : null,
          !hasCookieBanner ? "Add a GDPR-compliant cookie consent banner (required in Germany)" : null,
          "Ensure navigation is clear and visible on all devices",
          "Add clear calls-to-action on every page",
          "Test your site with real users from your target audience",
        ].filter(Boolean) as string[],
      },
    ];

    const overallScore = Math.round(
      scores.reduce((sum, s) => sum + s.score, 0) / scores.length
    );

    const summaryMap: Record<string, string> = {
      A: "Your website is in great shape! A few fine-tuning opportunities remain.",
      B: "Solid performance with room for improvement in a few key areas.",
      C: "Your site has the basics, but significant improvements could meaningfully increase leads.",
      D: "Your website has critical issues that are likely costing you customers every day.",
      F: "Your website needs urgent attention — it may be actively driving potential customers away.",
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
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Audit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
