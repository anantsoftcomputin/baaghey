"use client";

import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useCommerce } from "@/components/CommerceProvider";
import { Wordmark } from "@/components/Wordmark";
import { formatPrice } from "@/lib/catalog";
import { customerErrors, shippingFor, type CheckoutCustomer } from "@/lib/commerce";

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void }; }
}

type Quote = { subtotal: number; discount: number; shipping: number; total: number; campaign: { code: string; name: string; discountPercent: number } | null };

const initialCustomer: CheckoutCustomer = { name: "", email: "", phone: "", address1: "", address2: "", city: "", state: "Gujarat", postalCode: "" };

export default function CheckoutPage() {
  const { cart, cartReady, subtotal, user, clearCart } = useCommerce();
  const [customer, setCustomer] = useState(initialCustomer);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponError, setCouponError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutCustomer, string>>>({});
  const router = useRouter();
  const total = quote?.total ?? subtotal + shippingFor(subtotal);
  const lines = cart.map(({ productId, size, quantity }) => ({ productId, size, quantity }));

  useEffect(() => { if (user) setCustomer((current) => ({ ...current, name: user.displayName ?? current.name, email: user.email ?? current.email, phone: user.phoneNumber ?? current.phone })); }, [user]);
  // Any bag change invalidates an applied promotion's numbers.
  useEffect(() => { setQuote(null); }, [cart]);

  function change(key: keyof CheckoutCustomer, value: string) {
    setCustomer((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function field(key: keyof CheckoutCustomer, label: string, props: React.InputHTMLAttributes<HTMLInputElement> & { optional?: boolean; wide?: boolean } = {}) {
    const { optional, wide, ...input } = props;
    const error = errors[key];
    return (
      <label className={`form-field ${wide ? "sm:col-span-2" : ""}`}>
        <span>{label}{optional ? <span className="ml-1 normal-case tracking-normal text-mute">(optional)</span> : <span aria-hidden="true" className="ml-0.5 text-pink-dark">*</span>}</span>
        <input name={key} value={customer[key] ?? ""} onChange={(e) => change(key, key === "postalCode" ? e.target.value.replace(/\D/g, "") : e.target.value)} required={!optional} aria-invalid={Boolean(error)} aria-describedby={error ? `${key}-error` : undefined} className={error ? "!border-pink-dark" : ""} {...input} />
        {error && <span id={`${key}-error`} className="mt-1 text-[12px] normal-case tracking-normal text-pink-dark">{error}</span>}
      </label>
    );
  }

  async function applyCoupon() {
    setCouponError("");
    const response = await fetch("/api/checkout/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: lines, coupon }) });
    const data = await response.json();
    if (!response.ok) { setQuote(null); setCouponError(data.error || "Could not apply that code."); return; }
    setQuote(data);
  }

  async function checkout() {
    if (!cart.length) return;
    const found = customerErrors(customer);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.querySelector<HTMLInputElement>(`input[name="${first}"]`)?.focus();
      setStatus("Please check the highlighted details.");
      return;
    }
    if (!window.Razorpay) { setStatus("Secure checkout is still loading. Try again in a moment."); return; }
    setLoading(true); setStatus("");
    try {
      const token = user ? await user.getIdToken() : "";
      const response = await fetch("/api/checkout/order", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ customer, coupon: quote?.campaign?.code ?? "", items: lines }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout could not be started.");
      let settled = false;
      const payment = new window.Razorpay({
        key: data.keyId, amount: data.amount, currency: data.currency, name: "BAAGAY", description: "Hand-tied Bandhani order", order_id: data.razorpayOrderId,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        theme: { color: "#24361A" },
        handler: async (result: Record<string, string>) => {
          settled = true;
          const verification = await fetch("/api/checkout/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...result, internalOrderId: data.internalOrderId }) });
          const verified = await verification.json();
          if (!verification.ok) { setStatus(verified.error || "Payment verification failed."); setLoading(false); return; }
          clearCart();
          router.push(`/order-confirmation?id=${verified.orderId}&access=${encodeURIComponent(verified.accessToken)}`);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            // Release the held pieces; a late UPI approval can still complete the order.
            if (!settled) void fetch("/api/checkout/abandon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: data.internalOrderId, accessToken: data.accessToken }) });
          },
        },
      });
      payment.on("payment.failed", (result) => { setStatus(result.error?.description || "Payment failed. Please try again."); });
      payment.open();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Checkout failed."); setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-white">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <header className="bg-green text-white">
        <div className="container-max gutter grid h-20 grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/cart" className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"><ArrowLeft size={14} /> Bag</Link>
          <Link href="/" aria-label="BAAGAY home"><Wordmark tone="yellow" className="text-[30px]" /></Link>
          <span className="flex items-center justify-end gap-2 text-xs"><LockKeyhole size={14} /> <span className="hidden text-white/85 sm:inline">Secure checkout</span></span>
        </div>
      </header>

      {!cartReady ? null : !cart.length && !loading ? (
        <section className="container-max gutter py-24 text-center">
          <h1 className="text-[22px] font-semibold uppercase tracking-[0.1em]">Your bag is empty</h1>
          <p className="mt-3 text-sm text-mute">Add a piece or two, then come back to check out.</p>
          <Link href="/shop" className="btn btn-primary mt-8">Continue shopping</Link>
        </section>
      ) : (
      <section className="container-max gutter grid gap-10 py-12 lg:grid-cols-[1fr_440px] lg:gap-16">
        <div>
          <p className="eyebrow text-green">Step 1 of 2</p>
          <h1 className="page-title mt-3">Where should it go?</h1>
          <p className="mt-2 text-[12px] text-mute"><span aria-hidden="true" className="text-pink-dark">*</span> Required</p>
          <form noValidate onSubmit={(event) => { event.preventDefault(); void checkout(); }} className="mt-8 grid gap-5 sm:grid-cols-2">
            {field("name", "Full name", { autoComplete: "name", wide: true })}
            {field("email", "Email", { type: "email", autoComplete: "email" })}
            {field("phone", "Phone", { type: "tel", autoComplete: "tel", placeholder: "+91 98765 43210" })}
            {field("address1", "Address", { autoComplete: "address-line1", wide: true })}
            {field("address2", "Apartment, landmark", { autoComplete: "address-line2", wide: true, optional: true })}
            {field("city", "City", { autoComplete: "address-level2" })}
            {field("state", "State", { autoComplete: "address-level1" })}
            {field("postalCode", "PIN code", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 6 })}
            <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
          </form>
        </div>

        <aside className="h-fit bg-paper p-6 sm:p-8 lg:sticky lg:top-8">
          <h2 className="text-[17px] font-semibold uppercase tracking-[0.1em]">Your order</h2>
          <ul className="mt-6 grid gap-4">
            {cart.map((item) => (
              <li key={`${item.productId}-${item.size}`} className="flex items-center gap-4">
                <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-xl bg-cream">{item.photo && <Image src={item.photo} alt="" fill sizes="56px" unoptimized={item.photo.startsWith("data:")} className="object-cover" />}</div>
                <div className="min-w-0 flex-1 text-sm"><p className="truncate">{item.name}</p><p className="text-mute">Size {item.size} × {item.quantity}</p></div>
                <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-2">
            <label htmlFor="coupon" className="sr-only">Promotion code</label>
            <input id="coupon" value={coupon} onChange={(event) => { setCoupon(event.target.value.toUpperCase()); setQuote(null); setCouponError(""); }} placeholder="Promotion code" className="h-12 min-w-0 flex-1 border border-line bg-white px-4 text-sm outline-none focus:border-green" />
            <button className="btn btn-outline h-12 px-5" disabled={!coupon.trim() || !cart.length} onClick={applyCoupon}>Apply</button>
          </div>
          {couponError && <p role="alert" className="mt-2 text-xs text-accent">{couponError}</p>}
          {quote?.campaign && <p className="mt-2 text-xs text-green">{quote.campaign.name}: {quote.campaign.discountPercent}% off eligible pieces applied.</p>}

          <dl className="mt-6 grid gap-3 border-t border-ink/10 pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{formatPrice(quote?.subtotal ?? subtotal)}</dd></div>
            {quote && quote.discount > 0 && <div className="flex justify-between text-green"><dt>Promotion {quote.campaign?.code}</dt><dd>−{formatPrice(quote.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-mute">Shipping</dt><dd>{(quote?.shipping ?? shippingFor(subtotal)) ? formatPrice(quote?.shipping ?? shippingFor(subtotal)) : "Free"}</dd></div>
            <div className="flex items-baseline justify-between border-t border-ink/10 pt-4"><dt>Total</dt><dd className="text-[17px] font-semibold uppercase tracking-[0.1em]">{formatPrice(total)}</dd></div>
          </dl>
          <button className="btn btn-primary mt-6 h-14 w-full" disabled={loading || !cart.length || Boolean(coupon.trim() && !quote)} onClick={checkout}>
            <LockKeyhole size={15} /> {loading ? "Opening payment…" : coupon.trim() && !quote ? "Apply your code first" : `Pay ${formatPrice(total)}`}
          </button>
          {status && <p role="alert" className="mt-4 text-sm leading-6 text-accent">{status}</p>}
          <p className="mt-4 text-xs leading-5 text-mute">Payments are processed by Razorpay. BAAGAY never sees or stores your card or UPI details.</p>
        </aside>
      </section>
      )}
    </main>
  );
}
