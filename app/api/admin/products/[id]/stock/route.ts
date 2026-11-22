import { NextResponse } from "next/server";
import { adminDatabase, adminFromRequest } from "@/lib/firebase-admin";
import { adjustProductStock, type StockAdjustment } from "@/lib/orders-server";

/** Relative stock corrections from the admin. Writing absolute counts from the
 * browser would erase pieces held by checkouts that happened since the admin
 * loaded the page, so stock only ever moves by deltas, transactionally. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminFromRequest(request))) return NextResponse.json({ error: "Admin permission required." }, { status: 403 });
  if (!adminDatabase) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { lines?: StockAdjustment[] };
  const lines = Array.isArray(body.lines) ? body.lines : [];
  const valid = lines.length > 0 && lines.length <= 50 && lines.every((line) =>
    Number.isInteger(line?.delta) && Math.abs(line.delta) <= 10_000 && (line.size === undefined || (typeof line.size === "string" && line.size.length > 0 && line.size.length <= 20 && !/[.#$/[\]]/.test(line.size))));
  if (!valid) return NextResponse.json({ error: "Invalid stock adjustment." }, { status: 400 });
  try {
    const stock = await adjustProductStock(id, lines);
    return NextResponse.json({ ok: true, inventory: stock.inventory, sizeInventory: stock.sizeInventory ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not adjust stock." }, { status: 404 });
  }
}
