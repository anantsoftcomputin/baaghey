import { NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { requestIp, sharedRateLimit } from "@/lib/rate-limit";
import { createHash } from "crypto";

export async function POST(request: Request) {
  if (!adminDatabase) return NextResponse.json({ error: "Newsletter service is not configured." }, { status: 503 });
  if (!(await sharedRateLimit(`newsletter:${requestIp(request)}`, 4, 10 * 60_000))) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { email?: string; website?: string };
  const email = body.email?.trim().toLowerCase();
  if (body.website) return NextResponse.json({ ok: true });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const id = createHash("sha256").update(email).digest("hex");
  await adminDatabase.ref(`newsletterSubscribers/${id}`).set({ email, createdAt: Date.now(), source: "website" });
  return NextResponse.json({ ok: true });
}
