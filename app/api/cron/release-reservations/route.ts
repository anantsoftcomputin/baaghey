import { NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { releaseStaleReservations } from "@/lib/orders-server";

/** Scheduled sweep so unpaid orders release their stock after 30 minutes even
 * when nobody else starts a checkout. Call with `Authorization: Bearer $CRON_SECRET`
 * (Vercel Cron sends this header automatically when CRON_SECRET is set). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!adminDatabase) return NextResponse.json({ error: "Order server is not configured." }, { status: 503 });
  const released = await releaseStaleReservations();
  return NextResponse.json({ ok: true, released });
}
