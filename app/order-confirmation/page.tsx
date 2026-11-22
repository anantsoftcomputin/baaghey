"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCommerce } from "@/components/CommerceProvider";
import { formatPrice } from "@/lib/catalog";
import type { CommerceOrder } from "@/lib/commerce";
import { Wordmark } from "@/components/Wordmark";

function Confirmation() {
  const params = useSearchParams();
  const { user } = useCommerce();
  const [order, setOrder] = useState<CommerceOrder | null>(null);
  const [status, setStatus] = useState("Loading your order…");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const id = params.get("id"); const access = params.get("access");
    if (!id) { setStatus("We couldn't find an order number in this link."); setFailed(true); return; }
    (async () => {
      const token = user ? await user.getIdToken() : "";
      const response = await fetch(`/api/orders/${encodeURIComponent(id)}${access ? `?access=${encodeURIComponent(access)}` : ""}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrder(data.order); setStatus("");
    })().catch((error) => { setStatus(error instanceof Error ? error.message : "Could not load order."); setFailed(true); });
  }, [params, user]);
  return (
    <section className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[32px] bg-paper p-7 sm:p-12">
      {order ? (
        <div className="relative">
          <p className="eyebrow mt-6 text-green">Payment confirmed</p>
          <h1 className="mt-3 text-[22px] font-semibold uppercase tracking-[0.1em]">Thank you, {order.customer.name.split(" ")[0]}.</h1>
          <p className="mt-5 leading-7 text-ink/70">Order <strong className="text-ink">{order.id.slice(-8).toUpperCase()}</strong> is confirmed and your pieces are being prepared. We&rsquo;ll write to {order.customer.email} when they ship.</p>
          <div className="mt-8 border-y border-ink/10 py-5">
            {order.items.map((item) => <div key={`${item.productId}-${item.size}`} className="flex justify-between gap-3 py-2 text-sm"><span>{item.name} · {item.size} × {item.quantity}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}
            {order.discount > 0 && <div className="flex justify-between py-2 text-sm text-green"><span>Promotion {order.campaignCode}</span><span>−{formatPrice(order.discount)}</span></div>}
            {order.shipping > 0 && <div className="flex justify-between py-2 text-sm text-mute"><span>Shipping</span><span>{formatPrice(order.shipping)}</span></div>}
            <div className="mt-3 flex items-baseline justify-between border-t border-ink/10 pt-4"><span>Total</span><span className="text-[17px] font-semibold uppercase tracking-[0.1em]">{formatPrice(order.total)}</span></div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="btn btn-primary">Continue shopping</Link>{user && <Link href="/account" className="btn btn-outline">View orders</Link>}</div>
        </div>
      ) : failed ? (
        <div className="relative">
          <h1 className="text-[22px] font-semibold uppercase tracking-[0.1em]">We couldn&rsquo;t show this order</h1>
          <p role="alert" className="mt-4 leading-7 text-ink/70">{status} If you&rsquo;ve just paid, your confirmation email has the details, or you can find the order under your account.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/account" className="btn btn-primary">Your orders</Link><Link href="/shop" className="btn btn-outline">Continue shopping</Link></div>
        </div>
      ) : <h1 role="status" className="relative text-mute">{status}</h1>}
    </section>
  );
}

export default function OrderConfirmationPage() { return <main className="flex min-h-screen flex-col items-center bg-kora px-4 pb-12"><Link href="/" aria-label="BAAGAY home" className="py-8"><Wordmark tone="green" className="text-[34px]" /></Link><Suspense fallback={<p className="text-mute">Loading your order…</p>}><Confirmation /></Suspense></main>; }
