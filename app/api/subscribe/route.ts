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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, url, score, grade } = body as {
      email: string;
      url: string;
      score: number;
      grade?: string;
    };

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const lead: Lead = {
      email: email.trim().toLowerCase(),
      url,
      score: score || 0,
      grade: grade || "?",
      timestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || undefined,
    };

    const leads = await readLeads();

    // Check if email already submitted for this URL
    const exists = leads.some(
      (l) => l.email === lead.email && l.url === lead.url
    );
    if (exists) {
      return NextResponse.json({
        success: true,
        message: "You're already on our list! We'll be in touch soon.",
        alreadyExists: true,
      });
    }

    leads.push(lead);
    await writeLeads(leads);

    console.log(`New lead captured: ${lead.email} (${lead.url}, score: ${lead.score})`);

    return NextResponse.json({
      success: true,
      message:
        "Thanks! A member of the Nexprove team will reach out to you shortly.",
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint to download leads (protect with basic auth in production)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_KEY || "nexprove-admin";

  if (authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await readLeads();
  return NextResponse.json({ count: leads.length, leads });
}
