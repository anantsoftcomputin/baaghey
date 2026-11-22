import { NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/firebase-admin";
import { storeProductImage } from "@/lib/media-server";

export async function POST(request: Request) {
  if (!(await adminFromRequest(request))) return NextResponse.json({ error: "Admin permission required." }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const productId = String(form.get("productId") ?? "");
    if (!(file instanceof Blob)) return NextResponse.json({ error: "No image received." }, { status: 400 });
    const url = await storeProductImage(Buffer.from(await file.arrayBuffer()), file.type, productId);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
