import { NextResponse } from "next/server";
import { adminDatabase, userFromRequest } from "@/lib/firebase-admin";
import type { CommerceOrder } from "@/lib/commerce";

export async function GET(request: Request) {
  if (!adminDatabase) return NextResponse.json({ error: "Order server is not configured." }, { status: 503 });
  const user = await userFromRequest(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const snapshot = await adminDatabase.ref("orders").orderByChild("uid").equalTo(user.uid).get();
  const value = snapshot.val() as Record<string, CommerceOrder> | null;
  const orders = value ? Object.entries(value).map(([id, order]) => {
    const safe = { ...order, id } as CommerceOrder & { accessToken?: string };
    delete safe.accessToken;
    return safe;
  }).sort((a, b) => b.createdAt - a.createdAt) : [];
  return NextResponse.json({ orders });
}
