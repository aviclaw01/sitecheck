"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const translations = {
  en: {
    badge: "Free Website Audit",
    headline: "Is your dealership website",
    headlineAccent: "losing customers?",
    headlineDE: "Verliert Ihre Händler-Website Kunden?",
    subheadline:
      "Your website is your digital showroom — and right now, it might be driving buyers straight to your competitors. Get a free 60-second audit and find out exactly where you're losing them.",
    urlPlaceholder: "https://www.ihreautohändler.de",
    analyzeBtn: "Analyze Website →",
    analyzingBtn: "Analyzing...",
    urlError: "Please enter a valid website URL",
    stats: [
      { value: "67%", label: "of buyers abandon slow websites" },
      { value: "4x", label: "more leads from mobile-optimized sites" },
      { value: "83%", label: "check online before visiting a dealer" },
    ],
    howTitle: "How It Works",
    howSteps: [
      {
        num: "01",
        title: "Enter Your Website",
        desc: "Paste your dealership or logistics company URL into the field above. No signup required.",
      },
      {
        num: "02",
        title: "Instant Analysis",
        desc: "Our tool checks mobile responsiveness, page speed, SEO, local search presence, and more in seconds.",
      },
      {
        num: "03",
        title: "Get Your Report",
        desc: "Receive a detailed score with clear recommendations. Book a free consultation to fix the issues.",
      },
    ],
    benefitsTitle: "What We Check",
    benefits: [
      {
        icon: "📱",
        title: "Mobile Responsiveness",
        desc: "Most buyers search on their phone. Is your site ready?",
      },
      {
        icon: "⚡",
        title: "Page Speed",
        desc: "Every second of load time costs you potential customers.",
      },
      {
        icon: "🔍",
        title: "SEO Basics",
        desc: "Can Google find and rank your dealership website?",
      },
      {
        icon: "📍",
        title: "Local Search",
        desc: "Are you showing up when buyers search in your city?",
      },
      {
        icon: "🚗",
        title: "Inventory Features",
        desc: "Can customers easily browse and book test drives?",
      },
      {
        icon: "✨",
        title: "User Experience",
        desc: "Is your site easy to navigate and convert visitors?",
      },
    ],
    socialTitle: "Trusted by Dealers Across Germany",
    testimonials: [
      {
        quote:
          "We had no idea our website was scoring so poorly on mobile. After fixing the issues, our leads doubled in 3 months.",
        author: "Michael S.",
        role: "BMW Dealer, München",
      },
      {
        quote:
          "The audit revealed we weren't even showing up in local Google searches. The team at Nexprove fixed everything fast.",
        author: "Sabine K.",
        role: "Logistics Director, Hamburg",
      },
      {
        quote:
          "Simple, fast, and actionable. Every dealer needs to run this check at least once a year.",
        author: "Thomas R.",
        role: "Mercedes Dealer, Berlin",
      },
    ],
    footerTagline: "Built by Nexprove — Premium Product Development Studio",
    footerContact: "Get in touch",
    lang: "DE",
  },
  de: {
    badge: "Kostenloser Website-Audit",
    headline: "Verliert Ihre Website",
    headlineAccent: "Kunden?",
    headlineDE: "Is your website losing customers?",
    subheadline:
      "Ihre Website ist Ihr digitaler Showroom — und im Moment treibt sie vielleicht Käufer direkt zu Ihren Mitbewerbern. Erhalten Sie einen kostenlosen 60-Sekunden-Audit und finden Sie heraus, wo Sie Kunden verlieren.",
    urlPlaceholder: "https://www.ihreautohändler.de",
    analyzeBtn: "Website analysieren →",
    analyzingBtn: "Analysiere...",
    urlError: "Bitte geben Sie eine gültige Website-URL ein",
    stats: [
      { value: "67%", label: "der Käufer verlassen langsame Websites" },
      { value: "4x", label: "mehr Leads durch mobile-optimierte Seiten" },
      { value: "83%", label: "prüfen online, bevor sie zum Händler fahren" },
    ],
    howTitle: "So funktioniert es",
    howSteps: [
      {
        num: "01",
        title: "Website eingeben",
        desc: "Fügen Sie die URL Ihres Händlers oder Logistikunternehmens ein. Keine Anmeldung erforderlich.",
      },
      {
        num: "02",
        title: "Sofortige Analyse",
        desc: "Unser Tool prüft in Sekunden mobile Darstellung, Seitengeschwindigkeit, SEO, lokale Suche und mehr.",
      },
      {
        num: "03",
        title: "Bericht erhalten",
        desc: "Erhalten Sie eine detaillierte Bewertung mit klaren Empfehlungen. Buchen Sie eine kostenlose Beratung.",
      },
    ],
    benefitsTitle: "Was wir prüfen",
    benefits: [
      {
        icon: "📱",
        title: "Mobile Optimierung",
        desc: "Die meisten Käufer suchen per Smartphone. Ist Ihre Website bereit?",
      },
      {
        icon: "⚡",
        title: "Seitengeschwindigkeit",
        desc: "Jede Sekunde Ladezeit kostet Sie potenzielle Kunden.",
      },
      {
        icon: "🔍",
        title: "SEO-Grundlagen",
        desc: "Kann Google Ihre Händler-Website finden und ranken?",
      },
      {
        icon: "📍",
        title: "Lokale Suche",
        desc: "Erscheinen Sie, wenn Käufer in Ihrer Stadt suchen?",
      },
      {
        icon: "🚗",
        title: "Inventar-Funktionen",
        desc: "Können Kunden einfach stöbern und Probefahrten buchen?",
      },
      {
        icon: "✨",
        title: "Nutzererfahrung",
        desc: "Ist Ihre Website einfach zu bedienen und konvertiert sie Besucher?",
      },
    ],
    socialTitle: "Vertrauen von Händlern in ganz Deutschland",
    testimonials: [
      {
        quote:
          "Wir wussten nicht, wie schlecht unsere Website auf Mobilgeräten abschnitt. Nach den Verbesserungen verdoppelten sich unsere Leads in 3 Monaten.",
        author: "Michael S.",
        role: "BMW-Händler, München",
      },
      {
        quote:
          "Der Audit zeigte, dass wir in lokalen Google-Suchen nicht einmal auftauchten. Das Team von Nexprove hat alles schnell behoben.",
        author: "Sabine K.",
        role: "Logistikleiterin, Hamburg",
      },
      {
        quote:
          "Einfach, schnell und umsetzbar. Jeder Händler sollte diesen Check mindestens einmal jährlich durchführen.",
        author: "Thomas R.",
        role: "Mercedes-Händler, Berlin",
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
      const dataEncoded = encodeURIComponent(JSON.stringify(data));
      router.push(`/results?url=${encoded}&data=${dataEncoded}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 grid-pattern">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
              SC
            </div>
            <span className="font-semibold text-slate-100">SiteCheck</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === "en" ? "de" : "en")}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-500/50 transition-all"
            >
              {t.lang}
            </button>
            <a
              href="https://www.nexprove.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-400 hover:text-teal-400 transition-colors hidden sm:block"
            >
              by Nexprove
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            {t.badge}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 animate-fade-in-up-delay-1">
            <span className="text-slate-100">{t.headline} </span>
            <span className="gradient-text">{t.headlineAccent}</span>
          </h1>
          <p className="text-slate-500 text-lg mb-2 animate-fade-in-up-delay-2 italic">
            {t.headlineDE}
          </p>

          {/* Subheadline */}
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up-delay-2">
            {t.subheadline}
          </p>

          {/* URL Input */}
          <form
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto animate-fade-in-up-delay-3"
          >
            <div className="glass rounded-2xl p-2 flex flex-col sm:flex-row gap-2 border border-slate-700/50 focus-within:border-teal-500/50 transition-colors">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.urlPlaceholder}
                className="flex-1 bg-transparent px-4 py-3 text-slate-100 placeholder-slate-600 outline-none text-base"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base transition-all duration-200 glow-btn whitespace-nowrap"
              >
                {loading ? t.analyzingBtn : t.analyzeBtn}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-red-400 text-sm text-left px-2">
                {error}
              </p>
            )}
          </form>

          <p className="mt-4 text-slate-600 text-sm animate-fade-in-up-delay-4">
            Free forever · No signup required · Results in under 60 seconds
          </p>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto animate-fade-in-up-delay-4">
            {t.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-teal-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-slate-500 text-xs sm:text-sm leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-slate-100">
            {t.howTitle}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {t.howSteps.map((step, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 border border-slate-800/50 hover:border-teal-500/30 transition-all duration-300 group"
              >
                <div className="text-4xl font-bold text-slate-800 group-hover:text-teal-900 transition-colors mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-slate-100">
            {t.benefitsTitle}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.benefits.map((benefit, i) => (
              <div
                key={i}
                className="glass rounded-xl p-5 border border-slate-800/50 hover:border-teal-500/30 transition-all duration-300 flex gap-4 items-start group"
              >
                <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                  {benefit.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-100 mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-slate-100">
            {t.socialTitle}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {t.testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 border border-slate-800/50 flex flex-col gap-4"
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-teal-400 text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <div className="font-semibold text-slate-100 text-sm">
                    {testimonial.author}
                  </div>
                  <div className="text-slate-500 text-xs">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-950/40 to-slate-900/60 p-8 sm:p-12 text-center glass">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">
              Ready to see your score?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join hundreds of dealers and logistics companies who already know
              exactly what&apos;s costing them customers online.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-8 py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-base transition-all duration-200 glow-btn inline-block"
            >
              Check Your Website Free →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-500 flex items-center justify-center text-white font-bold text-xs">
              SC
            </div>
            <span>SiteCheck</span>
          </div>
          <p className="text-center">{t.footerTagline}</p>
          <a
            href="https://www.nexprove.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-teal-400 transition-colors"
          >
            {t.footerContact} →
          </a>
        </div>
      </footer>
    </div>
  );
}
