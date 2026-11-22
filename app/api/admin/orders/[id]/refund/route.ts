import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { adminDatabase, adminFromRequest } from "@/lib/firebase-admin";
import { transitionOrder } from "@/lib/orders-server";

/** A refund claim older than this is assumed to belong to a crashed request. */
const STALE_CLAIM_MS = 5 * 60_000;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminFromRequest(request))) return NextResponse.json({ error: "Admin permission required." }, { status: 403 });
  if (!adminDatabase || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: "Refund service is not configured." }, { status: 503 });
  const { id } = await params;

  // Claim the refund atomically so a double click cannot refund twice.
  const claim = await transitionOrder(id, (order) => {
    if (!order.razorpayPaymentId || order.status === "refunded") return null;
    if (order.refundInProgress && Date.now() - order.refundInProgress < STALE_CLAIM_MS) return null;
    return { refundInProgress: Date.now() };
  }).catch(() => null);
  if (!claim?.changed) return NextResponse.json({ error: "This order has no refundable captured payment, or a refund is already in progress." }, { status: 409 });

  try {
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const refund = await razorpay.payments.refund(claim.order.razorpayPaymentId!, { amount: claim.order.total * 100, speed: "normal", notes: { baagay_order_id: id } });
    await transitionOrder(id, () => ({ status: "refunded", razorpayRefundId: refund.id, refundedAt: Date.now(), refundInProgress: null }));
    return NextResponse.json({ ok: true, refundId: refund.id });
  } catch (error) {
    console.error("Razorpay refund failed", error);
    await transitionOrder(id, () => ({ refundInProgress: null })).catch(() => undefined);
    return NextResponse.json({ error: "Razorpay could not process this refund." }, { status: 502 });
  }
}
