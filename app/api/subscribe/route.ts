import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface Lead {
  email: string;
  url: string;
  score: number;
  grade: string;
  timestamp: string;
  ip?: string;
  source?: string;
}

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

async function sendEmails(lead: Lead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[SiteCheck] No RESEND_API_KEY set — skipping email");
    return;
  }

  const fromSitecheck = "SiteCheck <sitecheck@nexprove.com>";
  const fromNexprove = "Nexprove <hello@nexprove.com>";
  // Resend blocks same-domain: sitecheck@nexprove.com → hello@nexprove.com = suppressed
  // Set NOTIFY_EMAIL env var to a non-nexprove.com address to receive lead alerts
  const notifyEmail = process.env.NOTIFY_EMAIL || "hello@nexprove.com";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    // Notify Nexprove team
    await resend.emails.send({
      from: fromSitecheck,
      to: [notifyEmail],
      subject: `🔔 New Lead: ${lead.email} — Grade ${lead.grade} (${lead.score}/100)`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="margin:0 0 16px;font-size:20px;">New SiteCheck Lead</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#64748b;width:120px;">Email</td><td><strong>${lead.email}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Website</td><td><a href="${lead.url}">${lead.url}</a></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Score</td><td><strong>${lead.score}/100 (Grade ${lead.grade})</strong></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Source</td><td>${lead.source || "results-page"}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Time</td><td>${new Date(lead.timestamp).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })} CET</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">IP</td><td>${lead.ip || "—"}</td></tr>
          </table>
          <div style="margin-top:20px;">
            <a href="https://sitecheck-ten.vercel.app/results?url=${encodeURIComponent(lead.url)}"
               style="display:inline-block;background:#14b8a6;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
              View their SiteCheck report →
            </a>
          </div>
        </div>
      `,
    });

    // Confirmation to the lead
    await resend.emails.send({
      from: fromNexprove,
      to: [lead.email],
      subject: "Your website audit — what we found",
      html: `
        <div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#ffffff;color:#0f172a;">
          <div style="margin-bottom:28px;">
            <div style="display:inline-flex;align-items:center;gap:8px;">
              <div style="width:36px;height:36px;background:#14b8a6;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;">SC</div>
              <span style="color:#64748b;font-size:13px;">SiteCheck by Nexprove</span>
            </div>
          </div>

          <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;line-height:1.3;">
            We looked at your site. Here's what we found.
          </h1>

          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
            <strong>${lead.url}</strong> scored <strong style="color:${lead.grade === 'A' || lead.grade === 'B' ? '#14b8a6' : lead.grade === 'C' ? '#f59e0b' : '#ef4444'};">${lead.grade} (${lead.score}/100)</strong>.
          </p>

          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 28px;">
            Someone from our team will review your full report and send you a personalised breakdown of what to fix and in what order — within 24 hours.
          </p>

          <div style="background:#f8fafc;border-radius:10px;padding:18px 20px;border-left:4px solid #14b8a6;margin-bottom:28px;">
            <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Your Report</p>
            <a href="https://sitecheck-ten.vercel.app/results?url=${encodeURIComponent(lead.url)}"
               style="color:#14b8a6;font-size:14px;font-weight:600;text-decoration:none;">
              View full audit → sitecheck-ten.vercel.app
            </a>
          </div>

          <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 8px;">
            Want to talk sooner? Book a free 15-minute call:
          </p>
          <a href="https://www.nexprove.com/en/contact"
             style="display:inline-block;background:#0f172a;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:32px;">
            Talk to us at Nexprove →
          </a>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;"/>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            Nexprove — Premium Product Development Studio<br/>
            <a href="https://www.nexprove.com" style="color:#94a3b8;">nexprove.com</a> · hello@nexprove.com
          </p>
        </div>
      `,
    });

    console.log(`[SiteCheck] Emails sent for lead: ${lead.email}`);
  } catch (err) {
    // Log but don't fail the request — lead is captured even if email fails
    console.error("[SiteCheck] Email send failed:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, url, score, grade, source } = body as {
      email: string;
      url: string;
      score: number;
      grade?: string;
      source?: string;
    };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email address is required." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "Website URL is required." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || undefined;

    const lead: Lead = {
      email: email.trim().toLowerCase(),
      url: url.trim(),
      score: typeof score === "number" ? score : 0,
      grade: grade || "?",
      timestamp: new Date().toISOString(),
      ip,
      source: source || "results-page",
    };

    // Log to Vercel function logs (visible in dashboard)
    console.log(`[SiteCheck] NEW LEAD: ${lead.email} | ${lead.url} | ${lead.score} (${lead.grade}) | ${lead.ip}`);

    // Fire and forget — don't block the response
    sendEmails(lead).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Thanks! We'll be in touch within 24 hours.",
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
