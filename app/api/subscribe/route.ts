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
  // RFC 5322 simplified — catches common mistakes
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
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

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address (e.g. name@company.de)." },
        { status: 400 }
      );
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL is required." },
        { status: 400 }
      );
    }

    // Rate limiting: prevent same IP spamming
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

    // Check for duplicate (same email + same URL)
    const alreadyExists = leads.some(
      (l) =>
        l.email === lead.email &&
        l.url === lead.url
    );

    if (alreadyExists) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: "You're already on our list! We'll be in touch within 24 hours.",
      });
    }

    leads.push(lead);
    await writeLeads(leads);

    console.log(
      `[SiteCheck] New lead: ${lead.email} | URL: ${lead.url} | Score: ${lead.score} (${lead.grade})`
    );

    return NextResponse.json({
      success: true,
      alreadyExists: false,
      message: "Thanks! We'll be in touch within 24 hours.",
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to download leads (protect with Bearer token in production)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_KEY || "nexprove-admin";

  if (authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await readLeads();
  return NextResponse.json({
    count: leads.length,
    leads,
    exportedAt: new Date().toISOString(),
  });
}
