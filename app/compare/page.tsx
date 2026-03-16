"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuditScore {
  category: string;
  score: number;
  grade: string;
  status: "good" | "warning" | "poor";
}

interface AuditResult {
  url: string;
  overallScore: number;
  overallGrade: string;
  scores: AuditScore[];
  quickWins?: string[];
  loadTimeMs: number;
  loadable: boolean;
}

const gradeColors: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-teal-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

const gradeBg: Record<string, string> = {
  A: "bg-emerald-400/10 border-emerald-400/30",
  B: "bg-teal-400/10 border-teal-400/30",
  C: "bg-yellow-400/10 border-yellow-400/30",
  D: "bg-orange-400/10 border-orange-400/30",
  F: "bg-red-400/10 border-red-400/30",
};

function ScoreBar({ score, status }: { score: number; status: string }) {
  const colors: Record<string, string> = {
    good: "bg-gradient-to-r from-teal-500 to-emerald-400",
    warning: "bg-gradient-to-r from-yellow-500 to-amber-400",
    poor: "bg-gradient-to-r from-red-600 to-red-400",
  };
  return (
    <div className="relative h-1.5 w-full rounded-full bg-slate-800">
      <div
        className={`absolute left-0 top-0 h-full rounded-full ${colors[status] || colors.poor}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function CompareContent() {
  const router = useRouter();
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<[AuditResult, AuditResult] | null>(null);

  const normalizeUrl = (url: string) => {
    const u = url.trim();
    if (!u) return "";
    return /^https?:\/\//i.test(u) ? u : `https://${u}`;
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const u1 = normalizeUrl(url1);
    const u2 = normalizeUrl(url2);
    if (!u1 || !u2) { setError("Please enter both URLs."); return; }
    try { new URL(u1); new URL(u2); } catch { setError("Please enter valid URLs."); return; }

    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: u1 }) }).then(r => r.json()),
        fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: u2 }) }).then(r => r.json()),
      ]);
      setResults([r1, r2]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const winner = results ? (results[0].overallScore >= results[1].overallScore ? 0 : 1) : null;

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#020817]/90 backdrop-blur border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors text-sm">
            ← Back
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-xs">SC</div>
            <span className="font-semibold text-slate-100 text-sm">SiteCheck</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-medium mb-5">
            ⚖️ Competitor Comparison
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-3">
            Compare Two Dealership Websites
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            See how your website stacks up against a competitor — scored on the same 20 dealer criteria.
          </p>
        </div>

        {/* Input Form */}
        {!results && (
          <form onSubmit={handleCompare} className="mb-10">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Your Website</label>
                <input
                  type="text"
                  value={url1}
                  onChange={e => setUrl1(e.target.value)}
                  placeholder="https://www.ihrautohaus.de"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500/50 transition-colors text-sm"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Competitor Website</label>
                <input
                  type="text"
                  value={url2}
                  onChange={e => setUrl2(e.target.value)}
                  placeholder="https://www.mitbewerber.de"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500/50 transition-colors text-sm"
                  disabled={loading}
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white font-semibold text-sm transition-all"
            >
              {loading ? "Scanning both sites... (~15 seconds)" : "Compare Now — Free →"}
            </button>
            <p className="text-center text-slate-600 text-xs mt-3">Both sites audited simultaneously · No signup required</p>
          </form>
        )}

        {/* Results */}
        {results && (
          <div>
            {/* Winner banner */}
            {winner !== null && (
              <div className={`rounded-xl border p-4 mb-6 text-center ${gradeBg[results[winner].overallGrade]}`}>
                <p className="text-sm font-semibold text-slate-200">
                  {winner === 0 ? "✓ Your site leads" : "⚠ Competitor leads"} — by {Math.abs(results[0].overallScore - results[1].overallScore)} points
                </p>
                {winner === 1 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Closing this gap could mean more leads going your way each month.
                  </p>
                )}
              </div>
            )}

            {/* Side by side scores */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {results.map((r, i) => (
                <div key={i} className={`rounded-2xl border p-6 ${i === winner ? "border-teal-500/40 bg-teal-950/10" : "border-slate-800/50 bg-slate-900/30"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{i === 0 ? "Your site" : "Competitor"}</p>
                      <p className="text-sm font-medium text-slate-300 truncate max-w-[180px]">
                        {r.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-4xl font-bold ${gradeColors[r.overallGrade]}`}>{r.overallGrade}</p>
                      <p className="text-slate-500 text-xs">{r.overallScore}/100</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {r.scores.map(s => (
                      <div key={s.category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-400 truncate max-w-[140px]">{s.category}</span>
                          <span className={`text-xs font-bold ${gradeColors[s.grade]}`}>{s.grade} {s.score}</span>
                        </div>
                        <ScoreBar score={s.score} status={s.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Category comparison table */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-slate-800/50">
                <h3 className="text-sm font-semibold text-slate-300">Category Breakdown</h3>
              </div>
              <div className="divide-y divide-slate-800/30">
                {results[0].scores.map((s, i) => {
                  const s2 = results[1].scores[i];
                  const diff = s.score - s2.score;
                  return (
                    <div key={s.category} className="flex items-center px-5 py-3 gap-4">
                      <div className="flex-1 text-xs text-slate-400">{s.category}</div>
                      <div className={`text-sm font-bold w-16 text-center ${gradeColors[s.grade]}`}>
                        {s.grade} ({s.score})
                      </div>
                      <div className={`text-xs w-16 text-center font-medium ${diff > 0 ? "text-teal-400" : diff < 0 ? "text-red-400" : "text-slate-500"}`}>
                        {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "tie"}
                      </div>
                      <div className={`text-sm font-bold w-16 text-center ${gradeColors[s2.grade]}`}>
                        {s2.grade} ({s2.score})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-6 text-center">
              <h3 className="text-lg font-bold text-slate-100 mb-2">Want to close the gap?</h3>
              <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
                Our team at Nexprove will build you a prioritised fix list. Most clients go from {results[0].overallGrade} to B in 2–3 weeks.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://www.nexprove.com/en/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm transition-all"
                >
                  Talk to Nexprove →
                </a>
                <button
                  onClick={() => { setResults(null); setUrl1(""); setUrl2(""); }}
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-teal-400 hover:border-teal-500/40 font-medium text-sm transition-all"
                >
                  Compare Again
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
