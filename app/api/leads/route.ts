import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Admin endpoint — view all leads that submitted their email via SiteCheck results page
// Access: GET /api/leads?key=YOUR_ADMIN_KEY
// All leads are logged to Vercel function console — check logs in Vercel dashboard

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const adminKey = process.env.ADMIN_KEY || "nexprove-sitecheck-admin";

  if (key !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch leads from Resend sent emails (outbound = who we notified about)
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "No Resend key configured" }, { status: 500 });
  }

  try {
    const { execSync } = await import("child_process");
    const result = execSync(
      `curl -s "https://api.resend.com/emails?limit=50" -H "Authorization: Bearer ${apiKey}"`,
      { timeout: 10000 }
    ).toString();
    const data = JSON.parse(result);

    // Filter for lead notification emails (sent to notifyEmail about new leads)
    const leadEmails = (data.data || []).filter((e: { subject?: string }) =>
      e.subject?.includes("New Lead:")
    );

    // Parse lead info from subjects
    const leads = leadEmails.map((e: { subject?: string; created_at?: string; last_event?: string }) => {
      const match = e.subject?.match(/New Lead: (.+?) — Grade (\w+) \((\d+)/);
      return {
        email: match?.[1] || "unknown",
        grade: match?.[2] || "?",
        score: match?.[3] || "?",
        received_at: e.created_at,
        notification_status: e.last_event,
      };
    });

    return NextResponse.json({
      count: leads.length,
      leads,
      note: leads.length === 0
        ? "No leads yet — or NOTIFY_EMAIL is same domain as FROM (suppressed). Check Vercel function logs."
        : `${leads.length} leads captured`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
