import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Resend inbound email webhook handler
// Receives replies from German auto dealers, forwards notification to Avi via WhatsApp

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const NOTIFICATION_EMAIL = "hello@nexprove.com"; // Where to forward reply alerts

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let payload: Record<string, unknown>;

    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Handle Resend webhook events
    const eventType = payload.type as string;

    // Inbound email event
    if (eventType === "email.received" || payload.from) {
      const emailData = (payload.data || payload) as Record<string, unknown>;
      const from = emailData.from as string || "unknown";
      const subject = emailData.subject as string || "(no subject)";
      const text = emailData.text as string || emailData.html as string || "(no body)";
      const to = emailData.to as string || "sitecheck@nexprove.com";

      console.log(`[Inbound Reply] From: ${from} | Subject: ${subject}`);

      // Forward via Resend to Avi's main inbox
      if (RESEND_API_KEY) {
        const { execSync } = await import("child_process");
        const emailPayload = JSON.stringify({
          from: "SiteCheck Replies <sitecheck@nexprove.com>",
          to: [NOTIFICATION_EMAIL],
          subject: `📬 Reply from dealer: ${subject}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;padding:24px;">
              <h2 style="color:#14b8a6;margin:0 0 16px;">📬 Dealer Reply Received</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
                <tr><td style="padding:6px 0;color:#64748b;width:80px;">From</td><td><strong>${from}</strong></td></tr>
                <tr><td style="padding:6px 0;color:#64748b;">To</td><td>${to}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;">Subject</td><td>${subject}</td></tr>
              </table>
              <div style="background:#f8fafc;border-radius:8px;padding:16px;border-left:4px solid #14b8a6;">
                <pre style="margin:0;font-family:sans-serif;font-size:14px;white-space:pre-wrap;">${String(text).slice(0, 3000)}</pre>
              </div>
              <p style="color:#94a3b8;font-size:12px;margin-top:20px;">
                This reply was received at ${to}. Reply directly to ${from} or forward to your team.
              </p>
            </div>
          `,
        });

        const tmpFile = `/tmp/reply-fwd-${Date.now()}.json`;
        require("fs").writeFileSync(tmpFile, emailPayload);
        try {
          execSync(`curl -s -X POST https://api.resend.com/emails \
            -H "Authorization: Bearer ${RESEND_API_KEY}" \
            -H "Content-Type: application/json" \
            -d @${tmpFile}`, { timeout: 10000 });
          require("fs").unlinkSync(tmpFile);
        } catch (e) {
          console.error("Forward email failed:", e);
          try { require("fs").unlinkSync(tmpFile); } catch {}
        }
      }

      return NextResponse.json({ received: true, type: "inbound" });
    }

    // Delivery status events (bounce, open, click, delivered)
    if (eventType === "email.bounced") {
      const emailData = payload.data as Record<string, unknown>;
      console.log(`[BOUNCE] To: ${(emailData?.to as string[])?.join(", ")}`);
      // Could add WhatsApp alert for bounces here
    }

    if (eventType === "email.delivered") {
      console.log(`[DELIVERED] ${JSON.stringify(payload).slice(0, 200)}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "email-reply webhook" });
}
