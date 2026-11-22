import type { CommerceOrder } from "@/lib/commerce";
import { formatPrice } from "@/lib/catalog";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function sendOrderConfirmation(order: CommerceOrder) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return;
  const rows = order.items.map((item) => `<tr><td style="padding:8px 0">${escapeHtml(item.name)} · ${escapeHtml(item.size)} × ${item.quantity}</td><td style="padding:8px 0;text-align:right">${formatPrice(item.price * item.quantity)}</td></tr>`).join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json", "user-agent": "BAAGAY/1.0", "idempotency-key": `order-confirmation-${order.id}` },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [order.customer.email],
      subject: `BAAGAY order ${order.id.slice(-8).toUpperCase()} confirmed`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111"><h1>Thank you, ${escapeHtml(order.customer.name.split(" ")[0])}.</h1><p>Your payment is confirmed and your hand-tied pieces are being prepared.</p><table style="width:100%;border-top:1px solid #ddd;border-bottom:1px solid #ddd">${rows}<tr><td style="padding:16px 0;font-weight:bold">Total</td><td style="padding:16px 0;text-align:right;font-weight:bold">${formatPrice(order.total)}</td></tr></table><p>Order: <strong>${order.id.slice(-8).toUpperCase()}</strong></p><p>BAAGAY · Tied with Tradition. Crafted with Love.</p></div>`,
    }),
  });
  if (!response.ok) console.error("Order email failed", response.status, await response.text());
}
