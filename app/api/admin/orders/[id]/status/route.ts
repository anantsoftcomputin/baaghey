import { NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/firebase-admin";
import { transitionOrder } from "@/lib/orders-server";
import type { CommerceOrder } from "@/lib/commerce";

const SETTABLE: CommerceOrder["status"][] = ["pending_payment", "paid", "fulfilled", "cancelled"];

/** Manual status changes go through the server so stock is released when an
 * order is cancelled and held again if it is reinstated. Refunds use /refund. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminFromRequest(request))) return NextResponse.json({ error: "Admin permission required." }, { status: 403 });
  const { id } = await params;
  const { status } = await request.json().catch(() => ({})) as { status?: CommerceOrder["status"] };
  if (!status || !SETTABLE.includes(status)) return NextResponse.json({ error: "Unsupported status." }, { status: 400 });
  try {
    const result = await transitionOrder(id, (order) => (order.status === "refunded" || order.status === status ? null : { status }));
    return NextResponse.json({ ok: true, changed: result.changed });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update order." }, { status: 404 });
  }
}
