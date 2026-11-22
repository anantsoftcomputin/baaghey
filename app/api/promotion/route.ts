import { NextResponse } from "next/server";
import { serverCampaigns } from "@/lib/catalog-server";
import { campaignIsLive } from "@/lib/commerce";

export const revalidate = 300;

/** The one promotion the storefront advertises. Campaigns themselves are
 * admin-only in the database, so scheduled, expired, or unannounced codes are
 * never sent to browsers. */
export async function GET() {
  const live = (await serverCampaigns().catch(() => [])).find((campaign) => campaignIsLive(campaign));
  return NextResponse.json({ promotion: live ? { code: live.code, name: live.name, discountPercent: live.discountPercent } : null });
}
