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

function GradeRing({
  score,
  grade,
}: {
  score: number;
  grade: string;
}) {
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
        <span
          className={`text-5xl font-bold ${gradeColors[grade]}`}
        >
          {grade}
        </span>
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
      // Re-fetch if no data param
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
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          url: data?.url || urlParam,
          score: data?.overallScore || 0,
          grade: data?.overallGrade || "?",
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
      recommendations: "Top Recommendations",
      cta: "Get a Free Consultation",
      ctaDesc:
        "Let our team at Nexprove fix these issues for you. No obligation — just a quick call to discuss your website.",
      ctaPlaceholder: "your@email.com",
      ctaBtn: "Book Free Consultation",
      ctaSent: "🎉 We'll be in touch soon!",
      footerText: "Report generated by SiteCheck",
      poweredBy: "Powered by Nexprove",
      langToggle: "DE",
      loadedIn: "Loaded in",
      notReachable: "Site not reachable",
    },
    de: {
      back: "← Andere Website analysieren",
      title: "Website-Audit-Bericht",
      for: "für",
      overall: "Gesamtpunktzahl",
      categories: "Kategorien",
      recommendations: "Empfehlungen",
      cta: "Kostenlose Beratung buchen",
      ctaDesc:
        "Lassen Sie unser Team von Nexprove diese Probleme für Sie beheben. Unverbindlich — nur ein kurzes Gespräch über Ihre Website.",
      ctaPlaceholder: "ihre@email.de",
      ctaBtn: "Kostenlose Beratung",
      ctaSent: "🎉 Wir melden uns bald bei Ihnen!",
      footerText: "Bericht erstellt von SiteCheck",
      poweredBy: "Entwickelt von Nexprove",
      langToggle: "EN",
      loadedIn: "Geladen in",
      notReachable: "Website nicht erreichbar",
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
        </div>
      </div>
    );
  }

  const displayUrl = data.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

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
            <Link
              href="/"
              className="flex items-center gap-2"
            >
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
        <div className="mb-10 animate-fade-in-up">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>{t.title}</span>
            <span>·</span>
            <span className="text-teal-400 truncate max-w-xs">{displayUrl}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            {t.title}{" "}
            <span className="text-slate-500 font-normal text-lg">
              {t.for}{" "}
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 hover:underline transition-colors"
              >
                {displayUrl}
              </a>
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {data.loadable
              ? `${t.loadedIn} ${(data.loadTimeMs / 1000).toFixed(1)}s · ${new Date(data.timestamp).toLocaleString()}`
              : `${t.notReachable} · ${new Date(data.timestamp).toLocaleString()}`}
          </p>
        </div>

        {/* Overall Score */}
        <div className="glass rounded-2xl border border-slate-800/50 p-6 sm:p-8 mb-6 animate-fade-in-up-delay-1">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="shrink-0">
              <GradeRing score={data.overallScore} grade={data.overallGrade} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                {t.overall}
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                {data.summary}
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {data.scores.map((s) => (
                  <div
                    key={s.category}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${statusColors[s.status]}`}
                    />
                    <span className="text-slate-400 text-xs">{s.category}</span>
                    <span
                      className={`font-bold text-xs ${gradeColors[s.grade]}`}
                    >
                      {s.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="mb-6 animate-fade-in-up-delay-2">
          <h2 className="text-xl font-bold text-slate-100 mb-4">
            {t.categories}
          </h2>
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
                      <span className="text-slate-400 text-sm">
                        {score.score}/100
                      </span>
                      <span
                        className={`text-xl font-bold ${gradeColors[score.grade]}`}
                      >
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
                              <span className="text-teal-400 shrink-0 mt-0.5">
                                →
                              </span>
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

        {/* Email CTA */}
        <div className="animate-fade-in-up-delay-3">
          <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-950/40 via-slate-900/60 to-slate-900/60 p-6 sm:p-8 glass">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-medium mb-3">
                  🚀 Free Consultation
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">
                  {t.cta}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-1">
                  {t.ctaDesc}
                </p>
                <p className="text-slate-500 text-xs">
                  Your website scored{" "}
                  <span className={`font-bold ${gradeColors[data.overallGrade]}`}>
                    {data.overallGrade} ({data.overallScore}/100)
                  </span>
                  . Our team can help you improve it.
                </p>
              </div>
              <div className="w-full sm:w-80 shrink-0">
                {emailSent ? (
                  <div className="glass rounded-xl border border-teal-500/30 p-5 text-center">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-teal-400 font-medium">{t.ctaSent}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Check your inbox for a confirmation.
                    </p>
                    <a
                      href="https://www.nexprove.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Visit nexprove.com →
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.ctaPlaceholder}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500/50 transition-colors text-sm"
                      disabled={emailLoading}
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
                    <p className="text-slate-600 text-xs text-center">
                      No spam, ever. Just one quick call.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-600 text-xs">
          <span>{t.footerText} · {new Date(data.timestamp).toLocaleDateString()}</span>
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
