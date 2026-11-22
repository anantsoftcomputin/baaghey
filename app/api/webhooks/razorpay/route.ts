import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { markOrderPaid, markPaymentFailed, orderIdForPayment } from "@/lib/orders-server";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !adminDatabase) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const raw = await request.text();
  const supplied = request.headers.get("x-razorpay-signature") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const valid = Buffer.byteLength(expected) === Buffer.byteLength(supplied) && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
  if (!valid) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  try {
    const event = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } } };
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id ? await orderIdForPayment(payment.order_id) : null;
    if (orderId && payment?.id && ["payment.captured", "order.paid"].includes(event.event ?? "")) await markOrderPaid(orderId, payment.id);
    // Only a still-pending order is marked failed; a retry may already have succeeded.
    if (orderId && event.event === "payment.failed") await markPaymentFailed(orderId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
