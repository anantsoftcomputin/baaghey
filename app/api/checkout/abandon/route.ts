import { NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { abandonOrder, type StoredOrder } from "@/lib/orders-server";

/** Called when the shopper dismisses the Razorpay window, releasing held stock. */
export async function POST(request: Request) {
  if (!adminDatabase) return NextResponse.json({ error: "Order server is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { orderId?: string; accessToken?: string };
  if (!body.orderId || !body.accessToken) return NextResponse.json({ error: "Missing order." }, { status: 400 });
  const order = (await adminDatabase.ref(`orders/${body.orderId}`).get()).val() as StoredOrder | null;
  if (!order?.accessToken || order.accessToken !== body.accessToken) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  await abandonOrder(body.orderId);
  return NextResponse.json({ ok: true });
}
