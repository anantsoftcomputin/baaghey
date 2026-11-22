import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import type { CommerceOrder } from "@/lib/commerce";
import { markOrderPaid } from "@/lib/orders-server";

function matchesSignature(orderId: string, paymentId: string, supplied: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!adminDatabase) return NextResponse.json({ error: "Order server is not configured." }, { status: 503 });
  try {
    const body = await request.json() as { internalOrderId?: string; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
    if (!body.internalOrderId || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) return NextResponse.json({ error: "Incomplete payment response." }, { status: 400 });
    const ref = adminDatabase.ref(`orders/${body.internalOrderId}`);
    const snapshot = await ref.get();
    const order = snapshot.val() as (CommerceOrder & { accessToken: string }) | null;
    if (!order || order.razorpayOrderId !== body.razorpay_order_id || !matchesSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    await markOrderPaid(body.internalOrderId, body.razorpay_payment_id);
    return NextResponse.json({ ok: true, orderId: body.internalOrderId, accessToken: order.accessToken });
  } catch (error) {
    console.error("Payment verification failed", error);
    return NextResponse.json({ error: "Payment verification failed. Contact us if your account was debited." }, { status: 500 });
  }
}
