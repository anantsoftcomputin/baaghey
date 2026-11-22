"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CommerceOrder } from "@/lib/commerce";
import { formatPrice } from "@/lib/catalog";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageIntro } from "@/components/PageIntro";
import { useCommerce } from "@/components/CommerceProvider";
import { Wordmark } from "@/components/Wordmark";

const STATUS_LABEL: Record<CommerceOrder["status"], string> = {
  pending_payment: "Awaiting payment",
  payment_failed: "Payment failed",
  abandoned: "Not completed",
  paid: "Being prepared",
  fulfilled: "Shipped",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function AccountPage() {
  const { user, authReady, openAuth, logout } = useCommerce();
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) => fetch("/api/orders", { headers: { authorization: `Bearer ${token}` } })).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setOrders(data.orders ?? [])).catch(() => setStatus("Could not load orders."));
  }, [user]);
  return (
    <main className="min-h-screen">
      <StoreHeader />
      <section className="container-max gutter pb-28 pt-[124px]">
        <PageIntro eyebrow="Your BAAGAY" title={user?.displayName ? `Namaste, ${user.displayName.split(" ")[0]}.` : "Your account"} />
        {!authReady ? <p className="mt-10 text-mute">Loading…</p> : !user ? (
          <div className="mt-12 bg-paper p-8 sm:p-12">
            <h2 className="text-[17px] font-semibold uppercase tracking-[0.1em]">Sign in to see your orders and saved pieces.</h2>
            <button className="btn btn-primary mt-7" onClick={openAuth}>Sign in or register</button>
          </div>
        ) : (
          <div className="mt-12 grid gap-10 lg:grid-cols-[320px_1fr]">
            <aside className="h-fit bg-green p-7 text-white">
              <Wordmark tone="yellow" className="text-[40px]" />
              <p className="mt-6 text-lg">{user.displayName || "BAAGAY customer"}</p>
              <p className="text-sm text-paper/60">{user.email || user.phoneNumber}</p>
              <div className="mt-8 grid gap-2">
                <Link href="/wishlist" className="btn btn-light">Saved pieces</Link>
                <button className="btn border border-paper/30 text-paper" onClick={logout}>Sign out</button>
              </div>
            </aside>
            <div>
              <h2 className="text-[17px] font-semibold uppercase tracking-[0.1em]">Order history</h2>
              {status && <p className="mt-3 text-accent">{status}</p>}
              <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
                {orders.length ? orders.map((order) => (
                  <li key={order.id}>
                    <Link href={`/order-confirmation?id=${order.id}`} className="group flex flex-wrap items-center justify-between gap-4 py-6">
                      <div>
                        <p className="text-[15px] font-semibold uppercase tracking-[0.1em] text-[20px] font-light">No. {order.id.slice(-8).toUpperCase()}</p>
                        <p className="mt-1 text-sm text-mute">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {order.items.reduce((n, item) => n + item.quantity, 0)} pieces</p>
                      </div>
                      <div className="flex items-center gap-5">
                        <span className="bg-cream px-2.5 py-1 text-xs">{STATUS_LABEL[order.status] ?? order.status}</span>
                        <span>{formatPrice(order.total)}</span>
                        <ArrowUpRight size={16} className="transition-transform duration-500 group-hover:rotate-45" />
                      </div>
                    </Link>
                  </li>
                )) : <li className="py-8 text-sm text-mute">No orders yet — your first hand-tied piece is waiting.</li>}
              </ul>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
