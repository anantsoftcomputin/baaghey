import { NextResponse } from "next/server";
import { priceBag, type RequestedLine } from "@/lib/catalog-server";
import { rateLimit, requestIp } from "@/lib/rate-limit";

/** Server-priced totals for the checkout summary, so a promotion's discount is
 * visible before the shopper opens the payment window. */
export async function POST(request: Request) {
  if (!rateLimit(`quote:${requestIp(request)}`, 30)) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { items?: RequestedLine[]; coupon?: string };
  const priced = await priceBag(body.items ?? [], body.coupon);
  if ("error" in priced) return NextResponse.json({ error: priced.error }, { status: priced.status });
  const { subtotal, discount, shipping, total, campaign } = priced;
  return NextResponse.json({ subtotal, discount, shipping, total, campaign: campaign ? { code: campaign.code, name: campaign.name, discountPercent: campaign.discountPercent } : null });
}
