"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const translations = {
  en: {
    badge: "Free Dealer Website Audit",
    headline: "Your dealership website is",
    headlineAccent: "costing you sales.",
    headlineDE: "Ihre Händler-Website kostet Sie Verkäufe.",
    subheadline:
      "SiteCheck audits auto dealership and logistics websites against 20 industry-specific criteria — mobile readiness, local SEO, inventory tools, booking features, and more. Not a generic web audit. Built for German auto dealers.",
    urlPlaceholder: "https://www.ihreautohändler.de",
    analyzeBtn: "Get My Free Report",
    analyzingBtn: "Scanning website...",
    urlError: "Please enter a valid website URL",
    stats: [
      {
        value: "67%",
        label: "of buyers abandon slow dealer sites",
        source: "Google/Think with Google, 2023",
      },
      {
        value: "4x",
        label: "more leads from mobile-optimized sites",
        source: "Google/Think with Google, 2023",
      },
      {
        value: "83%",
        label: "research online before visiting a dealer",
        source: "Cox Automotive Car Buyer Journey, 2023",
      },
    ],
    howTitle: "How It Works",
    howSteps: [
      {
        num: "01",
        title: "Enter Your Website",
        desc: "Paste your dealership or logistics company URL. No signup required.",
      },
      {
        num: "02",
        title: "Instant Analysis",
        desc: "We check mobile responsiveness, page speed, SEO, local search presence, inventory features, and booking tools.",
      },
      {
        num: "03",
        title: "Get Your Report",
        desc: "Detailed score with clear recommendations. Book a free consultation to fix the issues.",
      },
    ],
    benefitsTitle: "What We Check",
    benefits: [
      {
        title: "Mobile Responsiveness",
        desc: "Most buyers search on their phone. Is your site ready?",
      },
      {
        title: "Page Speed",
        desc: "Every second of load time costs you potential customers.",
      },
      {
        title: "SEO Basics",
        desc: "Can Google find and rank your dealership website?",
      },
      {
        title: "Local Search",
        desc: "Are you showing up when buyers search in your city?",
      },
      {
        title: "Inventory & Booking",
        desc: "Can customers browse vehicles and book test drives online?",
      },
      {
        title: "Trust Signals",
        desc: "WhatsApp, Google Maps, reviews — the things buyers look for.",
      },
    ],
    footerTagline: "Built by Nexprove — Premium Product Development Studio",
    footerContact: "Get in touch",
    lang: "DE",
  },
  de: {
    badge: "Kostenloser Händler-Website-Audit",
    headline: "Ihre Website kostet Sie",
    headlineAccent: "Verkäufe.",
    headlineDE: "Your website is costing you sales.",
    subheadline:
      "SiteCheck prüft Autohaus- und Logistik-Websites anhand von 20 branchenspezifischen Kriterien — Mobile-Optimierung, lokale SEO, Fahrzeugbestand, Buchungstools und mehr. Kein allgemeiner Web-Audit. Entwickelt für deutsche Autohändler.",
    urlPlaceholder: "https://www.ihreautohändler.de",
    analyzeBtn: "Kostenlosen Bericht holen",
    analyzingBtn: "Website wird gescannt...",
    urlError: "Bitte geben Sie eine gültige Website-URL ein",
    stats: [
      {
        value: "67%",
        label: "der Käufer verlassen langsame Händler-Websites",
        source: "Google/Think with Google, 2023",
      },
      {
        value: "4x",
        label: "mehr Leads durch mobile-optimierte Seiten",
        source: "Google/Think with Google, 2023",
      },
      {
        value: "83%",
        label: "recherchieren online vor dem Händlerbesuch",
        source: "Cox Automotive Car Buyer Journey, 2023",
      },
    ],
    howTitle: "So funktioniert es",
    howSteps: [
      {
        num: "01",
        title: "Website eingeben",
        desc: "Fügen Sie die URL Ihres Autohauses oder Logistikunternehmens ein. Keine Anmeldung nötig.",
      },
      {
        num: "02",
        title: "Sofortige Analyse",
        desc: "Wir prüfen Mobile-Darstellung, Ladezeit, SEO, lokale Suche, Fahrzeugbestand und Buchungstools.",
      },
      {
        num: "03",
        title: "Bericht erhalten",
        desc: "Detaillierte Bewertung mit klaren Empfehlungen. Buchen Sie eine kostenlose Beratung.",
      },
    ],
    benefitsTitle: "Was wir prüfen",
    benefits: [
      {
        title: "Mobile Optimierung",
        desc: "Die meisten Käufer suchen per Smartphone. Ist Ihre Website bereit?",
      },
      {
        title: "Seitengeschwindigkeit",
        desc: "Jede Sekunde Ladezeit kostet Sie potenzielle Kunden.",
      },
      {
        title: "SEO-Grundlagen",
        desc: "Kann Google Ihre Händler-Website finden und ranken?",
      },
      {
        title: "Lokale Suche",
        desc: "Erscheinen Sie, wenn Käufer in Ihrer Stadt suchen?",
      },
      {
        title: "Inventar & Buchung",
        desc: "Können Kunden Fahrzeuge durchstöbern und Probefahrten buchen?",
      },
      {
        title: "Vertrauenssignale",
        desc: "WhatsApp, Google Maps, Bewertungen — worauf Käufer achten.",
      },
    ],
    footerTagline:
      "Entwickelt von Nexprove — Premium-Produktentwicklungsstudio",
    footerContact: "Kontakt aufnehmen",
    lang: "EN",
  },
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"en" | "de">("en");
  const router = useRouter();
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let normalizedUrl = url.trim();
    if (!normalizedUrl) {
      setError(t.urlError);
      return;
    }
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    try {
      new URL(normalizedUrl);
    } catch {
      setError(t.urlError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      const data = await res.json();
      const encoded = encodeURIComponent(normalizedUrl);
      // Pass only the URL — results page fetches fresh data (makes share links clean)
      router.push(`/results?url=${encoded}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-teal-500 flex items-center justify-center text-white font-bold text-xs">
              SC
            </div>
            <span className="font-semibold text-slate-100 text-sm">SiteCheck</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/compare"
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-500/50 transition-colors hidden sm:block"
            >
              ⚖️ Compare
            </a>
            <button
              onClick={() => setLang(lang === "en" ? "de" : "en")}
              className="text-xs font-medium px-3 py-1 rounded-full border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-500/50 transition-colors"
            >
              {t.lang}
            </button>
            <a
              href="https://www.nexprove.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-teal-400 transition-colors hidden sm:block"
            >
              by Nexprove
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            {t.badge}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
            <span className="text-slate-100">{t.headline} </span>
            <span className="text-teal-400">{t.headlineAccent}</span>
          </h1>
          <p className="text-slate-600 text-sm mb-2 italic">
            {t.headlineDE}
          </p>

          <p className="text-slate-400 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            {t.subheadline}
          </p>

          {/* URL Input */}
          <form
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto"
          >
            <div className="rounded-xl p-1.5 flex flex-col sm:flex-row gap-1.5 border border-slate-700/50 bg-slate-900/60 focus-within:border-teal-500/50 transition-colors">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.urlPlaceholder}
                className="flex-1 bg-transparent px-4 py-2.5 text-slate-100 placeholder-slate-600 outline-none text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors whitespace-nowrap"
              >
                {loading ? t.analyzingBtn : t.analyzeBtn}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-red-400 text-xs text-left px-2">
                {error}
              </p>
            )}
          </form>

          <p className="mt-3 text-slate-600 text-xs">
            Free · No signup · Results in 60 seconds
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-6 max-w-xl mx-auto">
            {t.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-teal-400 mb-0.5">
                  {stat.value}
                </div>
                <div className="text-slate-500 text-xs leading-tight">
                  {stat.label}
                </div>
                <div className="text-slate-700 text-[10px] mt-0.5">
                  {stat.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 sm:px-6 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 text-slate-100">
            {t.howTitle}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {t.howSteps.map((step, i) => (
              <div
                key={i}
                className="rounded-xl p-5 border border-slate-800/50 bg-slate-900/40"
              >
                <div className="text-3xl font-bold text-slate-800 mb-3">
                  {step.num}
                </div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Check */}
      <section className="py-12 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 text-slate-100">
            {t.benefitsTitle}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {t.benefits.map((benefit, i) => (
              <div
                key={i}
                className="rounded-lg p-4 border border-slate-800/50 bg-slate-900/40"
              >
                <h3 className="font-semibold text-slate-100 text-sm mb-1">
                  {benefit.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-600 text-xs mt-4">
            {lang === "de"
              ? "Diese Kriterien sind spezifisch für Autohäuser und Logistikunternehmen — kein allgemeiner Website-Audit."
              : "These criteria are specific to auto dealerships and logistics companies — not a generic website audit."}
          </p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
              {lang === "de" ? "Bereit für Ihren Score?" : "Ready to see your score?"}
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              {lang === "de"
                ? "Finden Sie heraus, wie Ihre Händler-Website bei 20 branchenspezifischen Kriterien abschneidet."
                : "Find out how your dealership website performs across 20 industry-specific criteria."}
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm transition-colors"
            >
              {lang === "de" ? "Kostenlosen Score holen" : "Get My Free Score"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-teal-500 flex items-center justify-center text-white font-bold text-[10px]">
              SC
            </div>
            <span>SiteCheck</span>
          </div>
          <p className="text-center">{t.footerTagline}</p>
          <a
            href="https://www.nexprove.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors"
          >
            {t.footerContact} &rarr;
          </a>
        </div>
      </footer>
    </div>
  );
}
