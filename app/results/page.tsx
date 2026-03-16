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
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
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
        <span className={`text-5xl font-bold ${gradeColors[grade]}`}>{grade}</span>
        <span className="text-slate-400 text-sm">{score}/100</span>
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
    <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden">
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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
        ok
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-red-500/10 text-red-400 border border-red-500/20"
      }`}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function EmailSuccessState({ lang }: { lang: "en" | "de" }) {
  return (
    <div className="glass rounded-xl border border-teal-500/30 p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">✅</span>
      </div>
      <h4 className="text-lg font-semibold text-teal-400 mb-2">
        {lang === "de" ? "Wir melden uns innerhalb von 24 Stunden!" : "We'll be in touch within 24 hours!"}
      </h4>
      <p className="text-slate-400 text-sm mb-4">
        {lang === "de"
          ? "Unser Team bei Nexprove wird sich mit einem persönlichen Aktionsplan für Ihre Website melden."
          : "Our team at Nexprove will reach out with a personalised action plan for your website."}
      </p>
      <div className="flex flex-col gap-2">
        <a
          href="https://www.nexprove.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full py-2 rounded-xl bg-teal-500/20 text-teal-400 text-sm font-medium hover:bg-teal-500/30 transition-colors"
        >
          {lang === "de" ? "Nexprove besuchen →" : "Visit nexprove.com →"}
        </a>
        <p className="text-slate-600 text-xs">
          {lang === "de"
            ? "Kein Spam, versprochen. Nur ein kurzes Gespräch."
            : "No spam, ever. Just a quick call."}
        </p>
      </div>
    </div>
  );
}

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
      back: "← Analyze Another Website",
      title: "Website Audit Report",
      for: "for",
      overall: "Overall Score",
      categories: "Category Breakdown",
      quickWins: "⚡ Quick Wins",
      quickWinsDesc: "These fixes take less than a day and have the highest impact:",
      missingElements: "🔴 Missing Elements",
      benchmark: "📊 Industry Benchmark",
      techDetails: "🔬 Technical Scan",
      cta: "Get Your Free Action Plan",
      ctaDesc:
        "Our team at Nexprove will build you a personalised fix list and quote — no obligation.",
      ctaPlaceholder: "your@email.com",
      ctaBtn: "Send Me the Action Plan →",
      ctaNote: "Free report · No credit card · We'll be in touch within 24 hours",
      footerText: "Report generated by SiteCheck",
      poweredBy: "Powered by Nexprove",
      langToggle: "DE",
      loadedIn: "Loaded in",
      notReachable: "Site not reachable",
      showMore: "Show all missing elements",
      showLess: "Show fewer",
    },
    de: {
      back: "← Andere Website analysieren",
      title: "Website-Audit-Bericht",
      for: "für",
      overall: "Gesamtpunktzahl",
      categories: "Kategorien-Übersicht",
      quickWins: "⚡ Schnelle Gewinne",
      quickWinsDesc: "Diese Korrekturen dauern weniger als einen Tag und haben den größten Effekt:",
      missingElements: "🔴 Fehlende Elemente",
      benchmark: "📊 Branchen-Benchmark",
      techDetails: "🔬 Technischer Scan",
      cta: "Kostenloser Aktionsplan",
      ctaDesc:
        "Unser Team bei Nexprove erstellt Ihnen eine persönliche Korrektliste und ein Angebot – unverbindlich.",
      ctaPlaceholder: "ihre@email.de",
      ctaBtn: "Aktionsplan zusenden →",
      ctaNote: "Kostenlos · Keine Kreditkarte · Rückmeldung innerhalb von 24 Stunden",
      footerText: "Bericht erstellt von SiteCheck",
      poweredBy: "Entwickelt von Nexprove",
      langToggle: "EN",
      loadedIn: "Geladen in",
      notReachable: "Website nicht erreichbar",
      showMore: "Alle fehlenden Elemente anzeigen",
      showLess: "Weniger anzeigen",
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
            className="text-teal-400 hover:text-teal-300 transition-colors"
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
          <div className="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Analyzing your website...</p>
          <p className="text-slate-600 text-sm mt-2">Checking 20+ signals — this takes ~15 seconds</p>
        </div>
      </div>
    );
  }

  const displayUrl = data.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const missing = data.missingElements || [];
  const shownMissing = showAllMissing ? missing : missing.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 grid-pattern">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-teal-400 transition-colors text-sm flex items-center gap-1"
          >
            {t.back}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "en" ? "de" : "en")}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-500/50 transition-all"
            >
              {t.langToggle}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-xs">
                SC
              </div>
              <span className="font-semibold text-slate-100 text-sm hidden sm:block">
                SiteCheck
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <span>{t.title}</span>
                <span>·</span>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 truncate max-w-xs hover:underline"
                >
                  {displayUrl}
                </a>
              </div>
              <p className="text-slate-500 text-sm">
                {data.loadable
                  ? `${t.loadedIn} ${(data.loadTimeMs / 1000).toFixed(1)}s · ${new Date(data.timestamp).toLocaleString()}`
                  : `${t.notReachable} · ${new Date(data.timestamp).toLocaleString()}`}
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
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-500/40 transition-all text-xs font-medium"
            >
              {copied ? "✓ Copied!" : "🔗 Share report"}
            </button>
          </div>
        </div>

        {/* Overall Score + Competitor Benchmark */}
        <div className="glass rounded-2xl border border-slate-800/50 p-6 sm:p-8 mb-6 animate-fade-in-up-delay-1">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="shrink-0">
              <GradeRing score={data.overallScore} grade={data.overallGrade} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-100 mb-2">{t.overall}</h2>
              <p className="text-slate-300 leading-relaxed mb-4">{data.summary}</p>

              {/* Competitor benchmark */}
              {data.competitorBenchmark && (
                <div className="inline-flex flex-col gap-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                    {t.benchmark}
                  </p>
                  <p className="text-sm text-slate-300">
                    Industry avg:{" "}
                    <span className="font-bold text-slate-100">
                      {data.competitorBenchmark.averageScore}/100
                    </span>{" "}
                    · Your rank:{" "}
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
                  <p className="text-xs text-slate-500">{data.competitorBenchmark.message}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {data.scores.map((s) => (
                  <div key={s.category} className="flex items-center gap-1.5 text-sm">
                    <span className={`w-2 h-2 rounded-full ${statusColors[s.status]}`} />
                    <span className="text-slate-400 text-xs">{s.category}</span>
                    <span className={`font-bold text-xs ${gradeColors[s.grade]}`}>
                      {s.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Wins */}
        {data.quickWins && data.quickWins.length > 0 && (
          <div className="glass rounded-2xl border border-amber-500/20 bg-amber-950/10 p-5 mb-6 animate-fade-in-up-delay-1">
            <h3 className="text-base font-bold text-amber-400 mb-1">{t.quickWins}</h3>
            <p className="text-slate-500 text-xs mb-3">{t.quickWinsDesc}</p>
            <ul className="space-y-2">
              {data.quickWins.map((win, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 shrink-0 mt-0.5 font-bold">{i + 1}.</span>
                  {win}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Category Scores */}
        <div className="mb-6 animate-fade-in-up-delay-2">
          <h2 className="text-xl font-bold text-slate-100 mb-4">{t.categories}</h2>
          <div className="space-y-3">
            {data.scores.map((score) => (
              <div
                key={score.category}
                className="glass rounded-xl border border-slate-800/50 hover:border-slate-700/50 transition-all duration-200 overflow-hidden"
              >
                <button
                  className="w-full p-4 sm:p-5 text-left"
                  onClick={() =>
                    setExpandedScore(
                      expandedScore === score.category ? null : score.category
                    )
                  }
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColors[score.status]}`}
                      />
                      <span className="font-medium text-slate-100 text-sm sm:text-base truncate">
                        {score.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-400 text-sm">{score.score}/100</span>
                      <span className={`text-xl font-bold ${gradeColors[score.grade]}`}>
                        {score.grade}
                      </span>
                      <span className="text-slate-600 text-xs">
                        {expandedScore === score.category ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                  <ScoreBar score={score.score} status={score.status} />
                </button>

                {expandedScore === score.category && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-slate-800/50 pt-4">
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      {score.explanation}
                    </p>
                    {score.recommendations.length > 0 && (
                      <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">
                          Recommendations
                        </p>
                        <ul className="space-y-2">
                          {score.recommendations.map((rec, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-slate-300"
                            >
                              <span className="text-teal-400 shrink-0 mt-0.5">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        {data.technicalDetails && (
          <div className="glass rounded-2xl border border-slate-800/50 p-5 mb-6 animate-fade-in-up-delay-2">
            <h3 className="text-base font-bold text-slate-100 mb-3">{t.techDetails}</h3>
            <div className="flex flex-wrap gap-2">
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

        {/* Missing Elements */}
        {missing.length > 0 && (
          <div className="glass rounded-2xl border border-red-500/20 bg-red-950/10 p-5 mb-6 animate-fade-in-up-delay-2">
            <h3 className="text-base font-bold text-red-400 mb-3">
              {t.missingElements} ({missing.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {shownMissing.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-red-500/10 text-red-400 border border-red-500/20"
                >
                  ✗ {item}
                </span>
              ))}
            </div>
            {missing.length > 6 && (
              <button
                onClick={() => setShowAllMissing(!showAllMissing)}
                className="mt-3 text-xs text-slate-500 hover:text-teal-400 transition-colors"
              >
                {showAllMissing ? t.showLess : `${t.showMore} (${missing.length - 6} more)`}
              </button>
            )}
          </div>
        )}

        {/* Email CTA */}
        <div className="animate-fade-in-up-delay-3">
          <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-950/40 via-slate-900/60 to-slate-900/60 p-6 sm:p-8 glass">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-medium mb-3">
                  🚀 Free Consultation
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">{t.cta}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-2">{t.ctaDesc}</p>
                <p className="text-slate-500 text-xs">
                  Your website scored{" "}
                  <span className={`font-bold ${gradeColors[data.overallGrade]}`}>
                    {data.overallGrade} ({data.overallScore}/100)
                  </span>
                  {data.missingElements && data.missingElements.length > 0 && (
                    <>
                      {" "}· {data.missingElements.length} issues detected
                    </>
                  )}
                </p>
              </div>
              <div className="w-full sm:w-80 shrink-0">
                {emailSent ? (
                  <EmailSuccessState lang={lang} />
                ) : (
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.ctaPlaceholder}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500/50 transition-colors text-sm"
                      disabled={emailLoading}
                      autoComplete="email"
                    />
                    {emailError && (
                      <p className="text-red-400 text-xs">{emailError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="w-full px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 glow-btn"
                    >
                      {emailLoading ? "Sending..." : t.ctaBtn}
                    </button>
                    <p className="text-slate-600 text-xs text-center">{t.ctaNote}</p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Check Competitor CTA */}
        <div className="mt-6 animate-fade-in-up-delay-3">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 glass">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-semibold text-slate-200 mb-1">
                  🔍 {lang === "de" ? "Wie schneidet Ihr Mitbewerber ab?" : "How does your competitor score?"}
                </p>
                <p className="text-slate-500 text-xs">
                  {lang === "de"
                    ? "Vergleichen Sie Ihre Website mit dem stärksten Mitbewerber."
                    : "Run a free check on any competing dealership to see how you compare."}
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="shrink-0 px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-teal-400 hover:border-teal-500/50 transition-all text-sm font-medium"
              >
                {lang === "de" ? "Mitbewerber prüfen →" : "Check a Competitor →"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-600 text-xs">
          <span>
            {t.footerText} · {new Date(data.timestamp).toLocaleDateString()}
          </span>
          <a
            href="https://www.nexprove.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors flex items-center gap-1"
          >
            {t.poweredBy} →
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
            <div className="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading results...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
