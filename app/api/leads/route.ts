import { NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { requestIp, sharedRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!adminDatabase) return NextResponse.json({ error: "Reservation service is not configured." }, { status: 503 });
  if (!(await sharedRateLimit(`lead:${requestIp(request)}`, 3, 10 * 60_000))) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { name?: string; email?: string; product?: string; note?: string; website?: string };
  if (body.website) return NextResponse.json({ ok: true });
  const email = body.email?.trim().toLowerCase();
  if (!body.name?.trim() || body.name.length > 120 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !body.product?.trim() || body.product.length > 200 || (body.note?.length ?? 0) > 1000) return NextResponse.json({ error: "Please complete the reservation form with a valid email." }, { status: 400 });
  await adminDatabase.ref("wishlistLeads").push().set({ name: body.name.trim(), email, product: body.product.trim(), note: body.note?.trim() ?? "", createdAt: Date.now() });
  return NextResponse.json({ ok: true });
}
