"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Minus, Plus } from "lucide-react";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/motion/Reveal";
import { useCommerce } from "@/components/CommerceProvider";
import { formatPrice } from "@/lib/catalog";
import { FREE_SHIPPING_AT, shippingFor } from "@/lib/commerce";

export default function CartPage() {
  const { cart, subtotal, updateQuantity, removeFromCart } = useCommerce();
  const shipping = shippingFor(subtotal);

  return (
    <main className="min-h-screen">
      <StoreHeader />
      <section className="container-max gutter pb-28 pt-[124px]">
        <Reveal as="h1" variant="lines" className="page-title">Your bag</Reveal>
        {cart.length === 0 ? (
          <div className="mt-12 grid min-h-80 place-items-center bg-paper p-10 text-center">
            <div>
              <h2 className="mt-3 text-[17px] font-semibold uppercase tracking-[0.1em]">Nothing tied up here yet.</h2>
              <Link href="/shop" className="btn btn-primary mt-7">Explore the edit <ArrowUpRight size={15} /></Link>
            </div>
          </div>
        ) : (
          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_420px]">
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {cart.map((item) => (
                <li key={`${item.productId}-${item.size}`} className="grid grid-cols-[110px_1fr] gap-5 py-6 sm:grid-cols-[150px_1fr]">
                  <Link href={`/products/${item.slug}`} scroll={false} className="overflow-hidden rounded-2xl relative aspect-[4/5] bg-cream">
                    {item.photo && <Image src={item.photo} alt={item.name} fill sizes="150px" unoptimized={item.photo.startsWith("data:")} className="object-cover object-[center_20%]" />}
                  </Link>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link href={`/products/${item.slug}`} scroll={false} className="text-[15px] font-semibold uppercase tracking-[0.1em]">{item.name}</Link>
                      <p>{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <p className="mt-1 text-sm text-mute">Size {item.size} · {formatPrice(item.price)} each</p>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex h-11 items-center border border-line">
                        <button aria-label={`Decrease ${item.name} quantity`} className="grid size-11 place-items-center" onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}><Minus size={14} /></button>
                        <span aria-live="polite" className="w-8 text-center text-sm">{item.quantity}</span>
                        <button aria-label={`Increase ${item.name} quantity`} className="grid size-11 place-items-center" onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}><Plus size={14} /></button>
                      </div>
                      <button className="text-sm text-mute link-underline hover:text-ink" onClick={() => removeFromCart(item.productId, item.size)}>Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="h-fit bg-paper p-7 lg:sticky lg:top-28">
              <h2 className="text-[17px] font-semibold uppercase tracking-[0.1em]">Summary</h2>
              <dl className="mt-6 grid gap-3 text-sm">
                <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-mute">Shipping</dt><dd>{shipping ? formatPrice(shipping) : "Free"}</dd></div>
                <div className="flex items-baseline justify-between border-t border-ink/10 pt-4"><dt>Total</dt><dd className="text-[17px] font-semibold uppercase tracking-[0.1em]">{formatPrice(subtotal + shipping)}</dd></div>
              </dl>
              {subtotal < FREE_SHIPPING_AT && <p className="mt-4 rounded-2xl bg-yellow-light p-3 text-xs leading-5">Add {formatPrice(FREE_SHIPPING_AT - subtotal)} more for free shipping.</p>}
              <Link href="/checkout" className="btn btn-primary mt-6 h-14 w-full">Checkout securely</Link>
              <p className="mt-3 text-center text-[11px] text-mute">Taxes included · Promotion codes apply at checkout</p>
            </aside>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
