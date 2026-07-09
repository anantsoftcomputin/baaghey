"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Mail, Phone, X } from "lucide-react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import {
  confirmPhoneOtp,
  firebaseReady,
  loginWithEmail,
  loginWithGoogle,
  makeRecaptcha,
  registerWithEmail,
  saveWishlistLead,
  sendPhoneOtp,
  subscribeCampaigns,
  subscribeCategories,
  subscribeProducts,
} from "@/lib/firebase";
import { bandhaniSteps, campaigns, categories, products, stories, type Campaign, type Category, type Product } from "@/lib/products";
import { categoryMedia } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { StoreHeader } from "@/components/StoreHeader";
import { BottomNav } from "@/components/BottomNav";
import { ValuesStrip } from "@/components/ValuesStrip";

type AuthMode = "email" | "google" | "phone";
type AuthForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  otp: string;
  note: string;
};

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("email");
  const [status, setStatus] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(categories);
  const [catalogCampaigns, setCatalogCampaigns] = useState<Campaign[]>(campaigns);
  const [selectedProduct, setSelectedProduct] = useState(products[0].name);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    otp: "",
    note: "",
  });

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribeProducts = subscribeProducts((items) => items.length && setCatalogProducts(items));
    const unsubscribeCategories = subscribeCategories((items) => items.length && setCatalogCategories(items));
    const unsubscribeCampaigns = subscribeCampaigns((items) => items.length && setCatalogCampaigns(items));
    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeCampaigns();
    };
  }, []);

  const activeProducts = useMemo(
    () => catalogProducts.filter((product) => product.status === "active"),
    [catalogProducts],
  );

  const featuredProducts = useMemo(
    () => activeProducts.filter((product) => product.featured).slice(0, 8),
    [activeProducts],
  );

  const sortedCategories = useMemo(
    () => [...catalogCategories].sort((a, b) => a.sortOrder - b.sortOrder),
    [catalogCategories],
  );

  void catalogCampaigns; // reserved for a future promo strip

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleEmailAuth(action: "register" | "login") {
    setStatus("");
    try {
      if (action === "register") {
        await registerWithEmail(form.name || "BAAGAY customer", form.email, form.password);
        setStatus("Registration saved in Realtime Database.");
      } else {
        await loginWithEmail(form.email, form.password);
        setStatus("Welcome back.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  async function handleGoogleAuth() {
    setStatus("");
    try {
      await loginWithGoogle();
      setStatus("Google sign-in complete and registration saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  }

  async function handleSendOtp() {
    setStatus("");
    try {
      const activeVerifier = verifier ?? makeRecaptcha("recaptcha-container");
      setVerifier(activeVerifier);
      const result = await sendPhoneOtp(form.phone, activeVerifier);
      setConfirmation(result);
      setStatus("OTP sent. Enter the code to continue.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send OTP.");
    }
  }

  async function handleConfirmOtp() {
    if (!confirmation) return;
    setStatus("");
    try {
      await confirmPhoneOtp(confirmation, form.otp, form.name || "Phone customer");
      setStatus("Phone registration saved in Realtime Database.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "OTP verification failed.");
    }
  }

  async function handleWishlistLead() {
    setStatus("");
    try {
      await saveWishlistLead({
        name: form.name || "Guest",
        email: form.email,
        product: selectedProduct,
        note: form.note,
      });
      setStatus("Wishlist request saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save request.");
    }
  }

  return (
    <main className="min-h-screen pb-16 text-black lg:pb-0">
      <StoreHeader count={activeProducts.length} />

      {/* Hero */}
      <section className="relative min-h-[90svh] overflow-hidden bg-black pt-24 text-white">
        <Image
          src="/images/baagay-shirt-hero.png"
          alt="Modern Bandhani shirts on a rail"
          fill
          priority
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="container-max relative flex min-h-[calc(90svh-6rem)] flex-col justify-end px-4 pb-16 sm:px-6 lg:px-10">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-yellow">New season</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] sm:text-7xl">
            Modern Bandhani, made to wear every day.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
            Contemporary Bandhej shirts, dresses, and overshirts made with the restraint of modern fashion and the craft of Gujarat.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex h-12 items-center gap-2 bg-green px-6 text-sm font-bold uppercase tracking-[0.1em] text-white">
              Shop now <ArrowRight size={16} />
            </Link>
            <a href="#craft" className="inline-flex h-12 items-center gap-2 border border-white/50 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white">
              Know the craft
            </a>
          </div>
        </div>
      </section>

      <ValuesStrip />

      {/* Category grid with video support */}
      <section id="collections" className="container-max px-4 py-14 sm:px-6 lg:px-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold sm:text-4xl">Shop by category</h2>
          <Link href="/collections" className="hidden items-center gap-1.5 text-sm font-semibold text-green-dark sm:flex">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {sortedCategories.map((category) => (
            <CategoryTile key={category.id} category={category} fallbackPhoto={activeProducts.find((p) => p.category === category.id)?.photo} />
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section id="shop" className="container-max px-4 py-14 sm:px-6 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Bandhej for now</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-mute">Hand-tied pieces, picked for the season.</p>
            </div>
            <Link href="/shop" className="hidden items-center gap-1.5 text-sm font-semibold text-green-dark sm:flex">
              Shop all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <div key={product.id} className="w-[46vw] shrink-0 snap-start sm:w-auto sm:shrink">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Craft story */}
      <section id="craft" className="border-t border-line px-4 py-16 sm:px-6 lg:px-10">
        <div className="container-max grid gap-10 lg:grid-cols-[0.9fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">Print nathi, Bandhej che</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Five thousand years, tied by hand.</h2>
            <p className="mt-6 text-base leading-7 text-mute">
              Bandhani is one of the oldest resist-dye crafts on earth, practised across Kutch and Saurashtra for centuries. Every dot you see was pinched and knotted by an artisan before the cloth was ever dyed — which is why the pattern breathes, and why no two of our pieces are truly identical.
            </p>
            <p className="mt-4 text-base leading-7 text-mute">
              We cut that living craft into shirts, overshirts and dresses you can actually wear out — heritage kept honest, worn easy.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {stories.map((story, index) => {
              const bar = [ "bg-green", "bg-pink", "bg-yellow" ][index % 3];
              return (
                <article key={story.city} className="border border-line p-5">
                  <span className={`block h-1 w-10 ${bar}`} />
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-mute">{story.city}</p>
                  <h3 className="mt-3 text-xl font-bold leading-snug">{story.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-mute">{story.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tie -> Dye -> Reveal */}
      <section id="craft-process" className="container-max px-4 py-16 sm:px-6 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-3 border-b border-line pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">How Bandhani is made</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Tie. Dye. Reveal.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-mute">
            The word <em>bandhani</em> comes from <em>bandhan</em> — to tie. Here is the same four-step ritual our artisans follow.
          </p>
        </div>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {bandhaniSteps.map((step, index) => {
            const dot = [ "text-green", "text-pink-dark", "text-yellow-dark", "text-green-dark" ][index % 4];
            return (
              <article key={step.step} className="flex flex-col bg-white p-6">
                <span className={`text-3xl font-bold ${dot}`}>{step.step}</span>
                <p className="mt-6 text-2xl font-bold leading-none">{step.gujarati}</p>
                <h3 className="mt-3 text-sm font-bold uppercase tracking-[0.1em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-mute">{step.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Journal */}
      <section id="journal" className="border-t border-line px-4 py-16 sm:px-6 lg:px-10">
        <div className="container-max">
          <div className="mb-8 border-b border-line pb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">BAAGAY journal</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Notes from the knot.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <EditorialCard accent="green" title="The Kamal shirt" copy="A relaxed camp collar, lotus-vine ties, and a madder red that moves easily from a garba night to a Sunday lunch." />
            <EditorialCard accent="pink" title="Bandhej in black" copy="Raat brings black into a festive craft — the same hand-tied dots, lit with gold, for a sharper modern evening." />
            <EditorialCard accent="yellow" title="From coast to city" copy="Kutch dyes, Saurashtra sun, and shapes cut for denim and daylight. Heritage you can wear on an ordinary Tuesday." />
          </div>
        </div>
      </section>

      {/* Reserve form */}
      <section className="container-max px-4 pb-16 sm:px-6 lg:px-10">
        <div className="grid gap-8 border border-line p-6 md:grid-cols-[0.8fr_1.2fr] md:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">Private preview</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Reserve a hand-tied piece.</h2>
          </div>
          <div className="grid gap-3">
            <input className="h-12 border border-line px-4 text-sm outline-none focus:border-green" placeholder="Name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
            <input className="h-12 border border-line px-4 text-sm outline-none focus:border-green" placeholder="Email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
            <select className="h-12 border border-line px-4 text-sm outline-none focus:border-green" value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
              {activeProducts.map((product) => (
                <option key={product.id}>{product.name}</option>
              ))}
            </select>
            <textarea className="min-h-24 border border-line p-4 text-sm outline-none focus:border-green" placeholder="Sizing, occasion, or styling note" value={form.note} onChange={(event) => updateForm("note", event.target.value)} />
            <button className="inline-flex h-12 items-center justify-center gap-2 bg-green px-5 text-sm font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60" disabled={!firebaseReady} onClick={handleWishlistLead}>
              Save request <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-4 py-12 pb-24 sm:px-6 lg:px-10 lg:pb-12">
        <div className="container-max grid gap-10 md:grid-cols-[1fr_2fr_1fr]">
          <div>
            <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={64} height={64} className="size-12 rounded-full" />
            <p className="mt-4 text-2xl font-bold">BAAGAY</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {sortedCategories.map((category) => (
              <Link key={category.id} className="border border-line p-4 text-sm font-semibold hover:border-green hover:text-green-dark" href={`/shop?category=${category.id}`}>
                {category.name}
              </Link>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-mute">Newsletter</p>
            <p className="mt-3 text-sm leading-6 text-mute">Festive edits, fresh drops, and craft stories from Gujarat.</p>
          </div>
        </div>
      </footer>

      <BottomNav count={activeProducts.length} />

      {authOpen && (
        <AuthDrawer
          mode={authMode}
          status={status}
          form={form}
          confirmation={confirmation}
          onClose={() => setAuthOpen(false)}
          onMode={setAuthMode}
          onForm={updateForm}
          onEmailAuth={handleEmailAuth}
          onGoogle={handleGoogleAuth}
          onSendOtp={handleSendOtp}
          onConfirmOtp={handleConfirmOtp}
        />
      )}
    </main>
  );
}

function CategoryTile({ category, fallbackPhoto }: { category: Category; fallbackPhoto?: string }) {
  const media = categoryMedia(category, fallbackPhoto);
  return (
    <Link href={`/shop?category=${category.id}`} className="group relative block aspect-[4/5] overflow-hidden bg-[#f4f4f4]">
      {media?.type === "video" ? (
        <video
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          src={media.src}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : media?.type === "photo" ? (
        <Image src={media.src} alt={category.name} fill sizes="(max-width: 640px) 90vw, 33vw" className="object-cover object-[center_18%] transition duration-300 group-hover:scale-[1.03]" />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="text-xl font-bold">{category.name}</h3>
        {(category.subcategories?.length ?? 0) > 0 && (
          <p className="mt-1 text-xs text-white/80">
            {category.subcategories!.map((s) => s.name).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}

const EDITORIAL_ACCENTS: Record<string, string> = {
  green: "bg-green",
  pink: "bg-pink",
  yellow: "bg-yellow",
};

function EditorialCard({ title, copy, accent }: { title: string; copy: string; accent: string }) {
  return (
    <article className="flex min-h-56 flex-col border border-line p-6">
      <span className={`block h-1 w-10 ${EDITORIAL_ACCENTS[accent] ?? "bg-green"}`} />
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-mute">Journal</p>
      <h3 className="mt-auto pt-8 text-2xl font-bold leading-tight">{title}</h3>
      <p className="mt-3 max-w-sm text-sm leading-6 text-mute">{copy}</p>
    </article>
  );
}

function AuthDrawer({
  mode,
  status,
  form,
  confirmation,
  onClose,
  onMode,
  onForm,
  onEmailAuth,
  onGoogle,
  onSendOtp,
  onConfirmOtp,
}: {
  mode: AuthMode;
  status: string;
  form: AuthForm;
  confirmation: ConfirmationResult | null;
  onClose: () => void;
  onMode: (mode: AuthMode) => void;
  onForm: (key: keyof AuthForm, value: string) => void;
  onEmailAuth: (action: "register" | "login") => void;
  onGoogle: () => void;
  onSendOtp: () => void;
  onConfirmOtp: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <aside className="ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6" onClick={(event) => event.stopPropagation()}>
        <button className="ml-auto grid size-10 place-items-center border border-line" onClick={onClose}>
          <X size={18} />
        </button>
        <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={64} height={64} className="mt-4 size-14 rounded-full" />
        <h2 className="mt-6 text-3xl font-bold">Join the list.</h2>
        <div className="mt-6 grid grid-cols-3 border border-line text-sm font-bold">
          {(["email", "google", "phone"] as AuthMode[]).map((item) => (
            <button key={item} className={`h-12 capitalize ${mode === item ? "bg-green text-white" : "bg-white"}`} onClick={() => onMode(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-3">
          {mode !== "google" && <input className="h-12 border border-line px-4 text-sm outline-none" placeholder="Name" value={form.name} onChange={(event) => onForm("name", event.target.value)} />}
          {mode === "email" && (
            <>
              <input className="h-12 border border-line px-4 text-sm outline-none" placeholder="Email" value={form.email} onChange={(event) => onForm("email", event.target.value)} />
              <input className="h-12 border border-line px-4 text-sm outline-none" placeholder="Password" type="password" value={form.password} onChange={(event) => onForm("password", event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <button disabled={!firebaseReady} className="admin-button" onClick={() => onEmailAuth("register")}>
                  <Mail size={16} /> Register
                </button>
                <button disabled={!firebaseReady} className="admin-button secondary" onClick={() => onEmailAuth("login")}>
                  Login
                </button>
              </div>
            </>
          )}
          {mode === "google" && (
            <button disabled={!firebaseReady} className="admin-button" onClick={onGoogle}>
              <Mail size={16} /> Continue with Google
            </button>
          )}
          {mode === "phone" && (
            <>
              <input className="h-12 border border-line px-4 text-sm outline-none" placeholder="+91 phone number" value={form.phone} onChange={(event) => onForm("phone", event.target.value)} />
              <button disabled={!firebaseReady} className="admin-button" onClick={onSendOtp}>
                <Phone size={16} /> Send OTP
              </button>
              <input className="h-12 border border-line px-4 text-sm outline-none" placeholder="OTP" value={form.otp} onChange={(event) => onForm("otp", event.target.value)} />
              <button disabled={!firebaseReady || !confirmation} className="admin-button secondary" onClick={onConfirmOtp}>
                Verify OTP
              </button>
            </>
          )}
          <div id="recaptcha-container" />
          {status && <p className="border border-line p-3 text-sm text-mute">{status}</p>}
        </div>
      </aside>
    </div>
  );
}
