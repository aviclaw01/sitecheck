import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

const DATA_FILE = path.join(process.cwd(), "data", "leads.json");

async function readLeads(): Promise<Lead[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Lead[];
  } catch {
    return [];
  }
}

async function writeLeads(leads: Lead[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

async function sendNotificationEmail(lead: Lead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // Graceful fallback — no email if no key

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    // Notify Nexprove of new lead
    await resend.emails.send({
      from: "SiteCheck <noreply@nexprove.com>",
      to: ["hello@nexprove.com"],
      subject: `New Lead: ${lead.email} — Score ${lead.score}`,
      html: `
        <h2>New SiteCheck Lead</h2>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Website:</strong> <a href="${lead.url}">${lead.url}</a></p>
        <p><strong>Score:</strong> ${lead.score}/100 (${lead.grade})</p>
        <p><strong>Time:</strong> ${new Date(lead.timestamp).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</p>
        <hr/>
        <p><a href="https://sitecheck-ten.vercel.app/api/subscribe?admin=true">View all leads</a></p>
      `,
    });

    // Send confirmation to the lead
    await resend.emails.send({
      from: "Nexprove <hello@nexprove.com>",
      to: [lead.email],
      subject: "Your free website audit report is ready",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#020817;color:#e2e8f0;border-radius:12px;">
          <div style="margin-bottom:24px;">
            <div style="width:40px;height:40px;background:#14b8a6;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px;">SC</div>
            <span style="color:#94a3b8;margin-left:8px;font-size:14px;">SiteCheck by Nexprove</span>
          </div>
          <h1 style="color:#f1f5f9;font-size:24px;margin-bottom:8px;">Thanks for running your audit ✓</h1>
          <p style="color:#94a3b8;line-height:1.6;">We've saved your report for <strong style="color:#14b8a6;">${lead.url}</strong> (Score: <strong style="color:#14b8a6;">${lead.score}/100</strong>).</p>
          <p style="color:#94a3b8;line-height:1.6;">A member of our team at Nexprove will review your results and reach out within <strong style="color:#f1f5f9;">24 hours</strong> with a personalised action plan.</p>
          <div style="margin:32px 0;padding:20px;background:#0f172a;border-radius:8px;border-left:4px solid #14b8a6;">
            <p style="color:#94a3b8;margin:0;font-size:14px;">In the meantime, here are your top 3 quick wins:</p>
          </div>
          <a href="https://www.nexprove.com/en/contact" style="display:inline-block;background:#14b8a6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">Talk to us now →</a>
          <hr style="border-color:#1e293b;margin:32px 0;"/>
          <p style="color:#475569;font-size:12px;">Nexprove — Premium Product Development Studio<br/>nexprove.com · hello@nexprove.com</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[SiteCheck] Email send failed:", err);
    // Don't throw — email failure should not fail the lead capture
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
      return NextResponse.json({ success: false, error: "Please enter a valid email address (e.g. name@company.de)." }, { status: 400 });
    }
    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "URL is required." }, { status: 400 });
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

    const leads = await readLeads();
    const alreadyExists = leads.some((l) => l.email === lead.email && l.url === lead.url);

    if (alreadyExists) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: "You're already on our list! We'll be in touch within 24 hours.",
      });
    }

    leads.push(lead);
    await writeLeads(leads);

    // Send emails (fire and forget — won't block response)
    sendNotificationEmail(lead).catch(console.error);

    console.log(`[SiteCheck] New lead: ${lead.email} | URL: ${lead.url} | Score: ${lead.score} (${lead.grade})`);

    return NextResponse.json({
      success: true,
      alreadyExists: false,
      message: "Thanks! We'll be in touch within 24 hours.",
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_KEY || "nexprove-admin";
  if (authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const leads = await readLeads();
  return NextResponse.json({ count: leads.length, leads, exportedAt: new Date().toISOString() });
}
