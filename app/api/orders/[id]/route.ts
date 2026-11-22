import { NextResponse } from "next/server";
import { adminDatabase, adminFromRequest, userFromRequest } from "@/lib/firebase-admin";
import type { CommerceOrder } from "@/lib/commerce";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDatabase) return NextResponse.json({ error: "Order server is not configured." }, { status: 503 });
  const { id } = await params;
  const snapshot = await adminDatabase.ref(`orders/${id}`).get();
  const order = snapshot.val() as (CommerceOrder & { accessToken?: string }) | null;
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const accessToken = new URL(request.url).searchParams.get("access");
  const user = await userFromRequest(request);
  const tokenMatches = Boolean(order.accessToken && accessToken === order.accessToken);
  const ownsOrder = Boolean(user && order.uid && user.uid === order.uid);
  if (!tokenMatches && !ownsOrder && !(await adminFromRequest(request))) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const safeOrder = { ...order };
  delete safeOrder.accessToken;
  return NextResponse.json({ order: { ...safeOrder, id } });
}
