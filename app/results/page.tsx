"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  quickWins?: string[];
  missingElements?: string[];
  competitorBenchmark?: CompetitorBenchmark;
  technicalDetails?: TechnicalDetails;
  pagespeedUrl?: string;
}

const gradeColors: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-teal-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

const gradeRingColors: Record<string, string> = {
  A: "stroke-emerald-400",
  B: "stroke-teal-400",
  C: "stroke-yellow-400",
  D: "stroke-orange-400",
  F: "stroke-red-400",
};

const statusColors: Record<string, string> = {
  good: "bg-emerald-400",
  warning: "bg-yellow-400",
  poor: "bg-red-400",
};

const statusBarColors: Record<string, string> = {
  good: "bg-gradient-to-r from-teal-500 to-emerald-400",
  warning: "bg-gradient-to-r from-yellow-500 to-amber-400",
  poor: "bg-gradient-to-r from-red-600 to-red-400",
};

function GradeRing({ score, grade }: { score: number; grade: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.1)"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${gradeRingColors[grade]} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${gradeColors[grade]}`}>{grade}</span>
        <span className="text-slate-400 text-xs">{score}/100</span>
      </div>
    </div>
  );
}

function ScoreBar({
  score,
  status,
}: {
  score: number;
  status: "good" | "warning" | "poor";
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
      <div
        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${statusBarColors[status]}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function TechBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        ok
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-red-500/10 text-red-400 border border-red-500/20"
      }`}
    >
      {ok ? "\u2713" : "\u2717"} {label}
    </span>
  );
}

function EmailSuccessState({ lang }: { lang: "en" | "de" }) {
  return (
    <div className="rounded-lg border border-teal-500/30 bg-slate-900/60 p-5 text-center">
      <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-3">
        <span className="text-xl text-teal-400">&#10003;</span>
      </div>
      <h4 className="text-base font-semibold text-teal-400 mb-1">
        {lang === "de" ? "Wir melden uns innerhalb von 24 Stunden!" : "We'll be in touch within 24 hours!"}
      </h4>
      <p className="text-slate-400 text-xs mb-3">
        {lang === "de"
          ? "Unser Team bei Nexprove wird sich mit einem persönlichen Aktionsplan für Ihre Website melden."
          : "Our team at Nexprove will reach out with a personalised action plan for your website."}
      </p>
      <a
        href="https://www.nexprove.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-full py-2 rounded-lg bg-teal-500/20 text-teal-400 text-xs font-medium hover:bg-teal-500/30 transition-colors"
      >
        {lang === "de" ? "Nexprove besuchen" : "Visit nexprove.com"} &rarr;
      </a>
    </div>
  );
}

const INVENTORY_CATEGORY_NAMES = [
  "Inventory & Booking Features",
  "Inventar & Buchungsfunktionen",
  "Inventory & Booking",
];

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [expandedScore, setExpandedScore] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "de">("en");
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  const urlParam = searchParams.get("url") || "";
  const dataParam = searchParams.get("data");

  useEffect(() => {
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setData(parsed);
      } catch {
        setError("Could not parse audit results.");
      }
    } else if (urlParam) {
      fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlParam }),
      })
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch(() => setError("Failed to load audit results."));
    } else {
      setError("No URL provided.");
    }
  }, [urlParam, dataParam]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(lang === "de" ? "Bitte E-Mail eingeben." : "Please enter your email address.");
      return;
    }
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
      setEmailError(
        lang === "de"
          ? "Bitte gültige E-Mail-Adresse eingeben."
          : "Please enter a valid email address."
      );
      return;
    }

    setEmailLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          url: data?.url || urlParam,
          score: data?.overallScore || 0,
          grade: data?.overallGrade || "?",
          source: "results-page",
        }),
      });
      const result = await res.json();
      if (result.success) {
        setEmailSent(true);
      } else {
        setEmailError(result.error || "Something went wrong. Try again.");
      }
    } catch {
      setEmailError("Network error. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const labels = {
    en: {
      back: "\u2190 Analyze Another Website",
      title: "Website Audit Report",
      for: "for",
      overall: "Overall Score",
      dealerNote: "Scored against 20 auto dealer criteria \u2014 not a general web audit",
      categories: "Category Breakdown",
      quickWins: "Quick Wins",
      quickWinsDesc: "These fixes take less than a day and have the highest impact:",
      missingElements: "Missing Elements",
      benchmark: "Industry Benchmark",
      techDetails: "Technical Scan",
      cta: "Get Free Action Plan from Nexprove",
      ctaDesc:
        "Our team will build you a personalised fix list and quote \u2014 no obligation.",
      ctaPlaceholder: "your@email.com",
      ctaBtn: "Send Me the Action Plan",
      ctaNote: "Free \u00b7 No credit card \u00b7 Response within 24 hours",
      ctaContact: "Or book a discovery call",
      footerText: "Report generated by SiteCheck",
      poweredBy: "Powered by Nexprove",
      langToggle: "DE",
      loadedIn: "Loaded in",
      notReachable: "Site not reachable",
      showMore: "Show all missing elements",
      showLess: "Show fewer",
      methodologyTitle: "How is this score calculated?",
      methodologyBody:
        "This audit checks 20 criteria specifically relevant to auto dealerships in Germany: mobile readiness, local search visibility, page speed, inventory features, booking tools, and trust signals. Criteria like WhatsApp contact, Google Maps, and vehicle inventory are weighted heavily because they directly impact lead generation for dealerships.",
      inventoryNote:
        "This category only applies to dealership websites. Generic business sites will score low here by design.",
    },
    de: {
      back: "\u2190 Andere Website analysieren",
      title: "Website-Audit-Bericht",
      for: "für",
      overall: "Gesamtpunktzahl",
      dealerNote: "Bewertet anhand von 20 Autohändler-Kriterien \u2014 kein allgemeiner Web-Audit",
      categories: "Kategorien-Übersicht",
      quickWins: "Schnelle Verbesserungen",
      quickWinsDesc: "Diese Korrekturen dauern weniger als einen Tag und haben den größten Effekt:",
      missingElements: "Fehlende Elemente",
      benchmark: "Branchen-Benchmark",
      techDetails: "Technischer Scan",
      cta: "Kostenloser Aktionsplan von Nexprove",
      ctaDesc:
        "Unser Team erstellt Ihnen eine persönliche Korrektliste und ein Angebot \u2014 unverbindlich.",
      ctaPlaceholder: "ihre@email.de",
      ctaBtn: "Aktionsplan zusenden",
      ctaNote: "Kostenlos \u00b7 Keine Kreditkarte \u00b7 Rückmeldung innerhalb von 24 Stunden",
      ctaContact: "Oder buchen Sie ein Erstgespräch",
      footerText: "Bericht erstellt von SiteCheck",
      poweredBy: "Entwickelt von Nexprove",
      langToggle: "EN",
      loadedIn: "Geladen in",
      notReachable: "Website nicht erreichbar",
      showMore: "Alle fehlenden Elemente anzeigen",
      showLess: "Weniger anzeigen",
      methodologyTitle: "Wie wird dieser Score berechnet?",
      methodologyBody:
        "Dieser Audit prüft 20 Kriterien, die speziell für Autohäuser in Deutschland relevant sind: Mobile-Optimierung, lokale Suchsichtbarkeit, Ladezeit, Fahrzeugbestand-Funktionen, Buchungstools und Vertrauenssignale. Kriterien wie WhatsApp-Kontakt, Google Maps und Fahrzeugbestand werden stark gewichtet, da sie die Lead-Generierung für Autohäuser direkt beeinflussen.",
      inventoryNote:
        "Diese Kategorie gilt nur für Autohaus-Websites. Allgemeine Unternehmensseiten erhalten hier absichtlich niedrige Punktzahlen.",
    },
  };

  const t = labels[lang];

  if (error) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-teal-400 hover:text-teal-300 transition-colors text-sm"
          >
            {t.back}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Analyzing your website...</p>
          <p className="text-slate-600 text-xs mt-1">Checking 20 signals — ~15 seconds</p>
        </div>
      </div>
    );
  }

  const displayUrl = data.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const missing = data.missingElements || [];
  const shownMissing = showAllMissing ? missing : missing.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-teal-400 transition-colors text-xs"
          >
            {t.back}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "en" ? "de" : "en")}
              className="text-xs font-medium px-2.5 py-1 rounded-full border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-500/50 transition-colors"
            >
              {t.langToggle}
            </button>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-teal-500 flex items-center justify-center text-white font-bold text-[10px]">
                SC
              </div>
              <span className="font-semibold text-slate-100 text-xs hidden sm:block">
                SiteCheck
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>{t.title}</span>
                <span>&middot;</span>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 truncate max-w-xs hover:underline"
                >
                  {displayUrl}
                </a>
              </div>
              <p className="text-slate-600 text-xs">
                {data.loadable
                  ? `${t.loadedIn} ${(data.loadTimeMs / 1000).toFixed(1)}s \u00b7 ${new Date(data.timestamp).toLocaleString()}`
                  : `${t.notReachable} \u00b7 ${new Date(data.timestamp).toLocaleString()}`}
              </p>
            </div>
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}/results?url=${encodeURIComponent(data.url)}`;
                navigator.clipboard.writeText(shareUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-500/40 transition-colors text-xs"
            >
              {copied ? "\u2713 Copied" : "Share report"}
            </button>
          </div>
        </div>

        {/* Overall Score */}
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-5 sm:p-6 mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="shrink-0">
              <GradeRing score={data.overallScore} grade={data.overallGrade} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-slate-100 mb-1">{t.overall}</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">{data.summary}</p>

              {/* Dealer-specific disclaimer */}
              <p className="text-xs text-slate-500 border border-slate-800 rounded-md px-3 py-1.5 inline-block mb-3">
                {t.dealerNote}
              </p>

              {/* Competitor benchmark */}
              {data.competitorBenchmark && (
                <div className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                    {t.benchmark}
                  </p>
                  <p className="text-xs text-slate-300">
                    Industry avg:{" "}
                    <span className="font-bold text-slate-100">
                      {data.competitorBenchmark.averageScore}/100
                    </span>{" "}
                    &middot; Your rank:{" "}
                    <span
                      className={`font-bold ${
                        data.overallScore >= data.competitorBenchmark.averageScore
                          ? "text-teal-400"
                          : "text-orange-400"
                      }`}
                    >
                      {data.competitorBenchmark.yourRank}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500">{data.competitorBenchmark.message}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {data.scores.map((s) => (
                  <div key={s.category} className="flex items-center gap-1 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColors[s.status]}`} />
                    <span className="text-slate-500">{s.category}</span>
                    <span className={`font-bold ${gradeColors[s.grade]}`}>
                      {s.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Methodology — collapsible */}
        <div className="mb-4">
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="text-xs text-slate-500 hover:text-teal-400 transition-colors flex items-center gap-1"
          >
            <span>{showMethodology ? "\u25B2" : "\u25BC"}</span>
            {t.methodologyTitle}
          </button>
          {showMethodology && (
            <div className="mt-2 rounded-lg border border-slate-800/50 bg-slate-900/40 p-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.methodologyBody}
              </p>
            </div>
          )}
        </div>

        {/* Quick Wins */}
        {data.quickWins && data.quickWins.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 mb-4">
            <h3 className="text-sm font-bold text-amber-400 mb-0.5">{t.quickWins}</h3>
            <p className="text-slate-500 text-xs mb-2">{t.quickWinsDesc}</p>
            <ul className="space-y-1.5">
              {data.quickWins.map((win, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-amber-400 shrink-0 font-bold">{i + 1}.</span>
                  {win}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Category Scores */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-100 mb-3">{t.categories}</h2>
          <div className="space-y-2">
            {data.scores.map((score) => {
              const isInventoryCategory = INVENTORY_CATEGORY_NAMES.some(
                (name) => score.category.toLowerCase().includes(name.toLowerCase())
              );
              return (
                <div
                  key={score.category}
                  className="rounded-lg border border-slate-800/50 bg-slate-900/40 overflow-hidden"
                >
                  <button
                    className="w-full p-3 sm:p-4 text-left"
                    onClick={() =>
                      setExpandedScore(
                        expandedScore === score.category ? null : score.category
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${statusColors[score.status]}`}
                        />
                        <span className="font-medium text-slate-100 text-sm truncate">
                          {score.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 text-xs">{score.score}/100</span>
                        <span className={`text-lg font-bold ${gradeColors[score.grade]}`}>
                          {score.grade}
                        </span>
                        <span className="text-slate-600 text-[10px]">
                          {expandedScore === score.category ? "\u25B2" : "\u25BC"}
                        </span>
                      </div>
                    </div>
                    <ScoreBar score={score.score} status={score.status} />
                  </button>

                  {expandedScore === score.category && (
                    <div className="px-3 sm:px-4 pb-4 border-t border-slate-800/50 pt-3">
                      {isInventoryCategory && (
                        <p className="text-[11px] text-slate-500 bg-slate-800/50 rounded px-2.5 py-1.5 mb-3 border border-slate-700/50">
                          {t.inventoryNote}
                        </p>
                      )}
                      <p className="text-slate-300 text-xs mb-3 leading-relaxed">
                        {score.explanation}
                      </p>
                      {score.recommendations.length > 0 && (
                        <div>
                          <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide mb-1.5">
                            Recommendations
                          </p>
                          <ul className="space-y-1.5">
                            {score.recommendations.map((rec, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-1.5 text-xs text-slate-300"
                              >
                                <span className="text-teal-400 shrink-0">&rarr;</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical Details */}
        {data.technicalDetails && (
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-4 mb-4">
            <h3 className="text-sm font-bold text-slate-100 mb-2">{t.techDetails}</h3>
            <div className="flex flex-wrap gap-1.5">
              <TechBadge ok={data.technicalDetails.https} label="HTTPS" />
              <TechBadge ok={data.technicalDetails.hasFavicon} label="Favicon" />
              <TechBadge ok={data.technicalDetails.hasOgImage} label="og:image" />
              <TechBadge ok={data.technicalDetails.hasTwitterCard} label="Twitter Card" />
              <TechBadge ok={data.technicalDetails.hasRobotsTxt} label="robots.txt" />
              <TechBadge ok={data.technicalDetails.hasSitemap} label="sitemap.xml" />
              <TechBadge ok={data.technicalDetails.hasAnalytics} label="Analytics" />
              <TechBadge ok={data.technicalDetails.hasPhone} label="Phone Number" />
              <TechBadge ok={data.technicalDetails.hasAddress} label="Address" />
              <TechBadge ok={data.technicalDetails.hasGoogleMaps} label="Google Maps" />
              <TechBadge ok={data.technicalDetails.hasWhatsApp} label="WhatsApp" />
              <TechBadge ok={data.technicalDetails.hasStructuredData} label="Schema.org" />
            </div>
          </div>
        )}

        {/* Verify with Google PageSpeed */}
        {data.pagespeedUrl && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-800/50 bg-slate-900/30 mb-3 animate-fade-in-up-delay-2">
            <div>
              <p className="text-xs font-medium text-slate-400">Want a second opinion?</p>
              <p className="text-xs text-slate-600 mt-0.5">Verify page speed with Google's own tool</p>
            </div>
            <a
              href={data.pagespeedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
            >
              🔗 Google PageSpeed →
            </a>
          </div>
        )}

        {/* Missing Elements */}
        {missing.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 mb-4">
            <h3 className="text-sm font-bold text-red-400 mb-2">
              {t.missingElements} ({missing.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {shownMissing.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20"
                >
                  &#10007; {item}
                </span>
              ))}
            </div>
            {missing.length > 6 && (
              <button
                onClick={() => setShowAllMissing(!showAllMissing)}
                className="mt-2 text-xs text-slate-500 hover:text-teal-400 transition-colors"
              >
                {showAllMissing ? t.showLess : `${t.showMore} (${missing.length - 6} more)`}
              </button>
            )}
          </div>
        )}

        {/* Email CTA */}
        <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-100 mb-1">{t.cta}</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-2">{t.ctaDesc}</p>
              <p className="text-slate-500 text-xs">
                Your website scored{" "}
                <span className={`font-bold ${gradeColors[data.overallGrade]}`}>
                  {data.overallGrade} ({data.overallScore}/100)
                </span>
                {data.missingElements && data.missingElements.length > 0 && (
                  <>
                    {" "}&middot; {data.missingElements.length} issues detected
                  </>
                )}
              </p>
              <a
                href="https://www.nexprove.com/en/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                {t.ctaContact} at nexprove.com/en/contact &rarr;
              </a>
            </div>
            <div className="w-full sm:w-72 shrink-0">
              {emailSent ? (
                <EmailSuccessState lang={lang} />
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.ctaPlaceholder}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500/50 transition-colors text-xs"
                    disabled={emailLoading}
                    autoComplete="email"
                  />
                  {emailError && (
                    <p className="text-red-400 text-xs">{emailError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="w-full px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors"
                  >
                    {emailLoading ? "Sending..." : t.ctaBtn}
                  </button>
                  <p className="text-slate-600 text-[10px] text-center">{t.ctaNote}</p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Check Competitor CTA */}
        <div className="mt-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-semibold text-slate-200 mb-0.5">
                  {lang === "de" ? "Wie schneidet Ihr Mitbewerber ab?" : "How does your competitor score?"}
                </p>
                <p className="text-slate-500 text-xs">
                  {lang === "de"
                    ? "Vergleichen Sie Ihre Website mit dem stärksten Mitbewerber."
                    : "Run a free check on any competing dealership to see how you compare."}
                </p>
              </div>
              <button
                onClick={() => router.push("/compare")}
                className="shrink-0 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-teal-400 hover:border-teal-500/50 transition-colors text-xs font-medium"
              >
                {lang === "de" ? "Mitbewerber vs. Wettbewerber →" : "Compare vs Competitor →"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-600 text-xs">
          <span>
            {t.footerText} &middot; {new Date(data.timestamp).toLocaleDateString()}
          </span>
          <a
            href="https://www.nexprove.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors"
          >
            {t.poweredBy} &rarr;
          </a>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020817] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading results...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
