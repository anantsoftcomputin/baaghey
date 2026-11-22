import { randomUUID } from "crypto";
import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { adminDatabase, firebaseAdminReady, userFromRequest } from "@/lib/firebase-admin";
import { priceBag, type RequestedLine } from "@/lib/catalog-server";
import { abandonOrder, releaseStaleReservations, reserveStock, type StoredOrder } from "@/lib/orders-server";
import { customerErrors, type CheckoutCustomer } from "@/lib/commerce";
import { requestIp, sharedRateLimit } from "@/lib/rate-limit";


export async function POST(request: Request) {
  if (!firebaseAdminReady || !adminDatabase) return NextResponse.json({ error: "Checkout server is not configured." }, { status: 503 });
  // Each order holds stock for up to 30 minutes, so cap how many one client can open.
  if (!(await sharedRateLimit(`order:${requestIp(request)}`, 6, 15 * 60_000))) return NextResponse.json({ error: "Too many checkout attempts. Please wait a few minutes and try again." }, { status: 429 });
  let orderId: string | null = null;
  try {
    const body = await request.json() as { items?: RequestedLine[]; customer?: CheckoutCustomer; coupon?: string };
    if (!body.customer || Object.keys(customerErrors(body.customer)).length) return NextResponse.json({ error: "Please enter a valid delivery address, email, phone, and six-digit PIN code." }, { status: 400 });
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: "Online payment is temporarily unavailable. Please try again later." }, { status: 503 });

    await releaseStaleReservations().catch((error) => console.error("Stale reservation sweep failed", error));
    const priced = await priceBag(body.items ?? [], body.coupon);
    if ("error" in priced) return NextResponse.json({ error: priced.error }, { status: priced.status });
    const { items, campaign, subtotal, discount, shipping, total } = priced;

    const orderRef = adminDatabase.ref("orders").push();
    if (!orderRef.key) throw new Error("Could not allocate an order number.");
    if (!(await reserveStock(items))) return NextResponse.json({ error: "Someone just bought the last of one of your pieces. Refresh your bag and try again." }, { status: 409 });

    const accessToken = randomUUID();
    const user = await userFromRequest(request);
    const order: StoredOrder = {
      id: orderRef.key,
      uid: user?.uid ?? null,
      customer: { ...body.customer, address2: body.customer.address2 ?? "" },
      items,
      subtotal,
      discount,
      ...(campaign ? { campaignCode: campaign.code } : {}),
      shipping,
      total,
      currency: "INR",
      status: "pending_payment",
      stockReserved: true,
      createdAt: Date.now(),
      accessToken,
    };
    await orderRef.set(order);
    orderId = order.id;

    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const paymentOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: `baagay_${orderRef.key.slice(-20)}`,
      notes: { baagay_order_id: orderRef.key, customer_email: body.customer.email.slice(0, 200) },
    });
    await orderRef.update({ razorpayOrderId: paymentOrder.id });
    return NextResponse.json({ internalOrderId: order.id, accessToken, razorpayOrderId: paymentOrder.id, amount: paymentOrder.amount, currency: paymentOrder.currency, keyId: process.env.RAZORPAY_KEY_ID, discount, total });
  } catch (error) {
    console.error("Checkout order creation failed", error);
    if (orderId) await abandonOrder(orderId).catch(() => undefined);
    return NextResponse.json({ error: "Could not start secure checkout. Please try again." }, { status: 500 });
  }
}
