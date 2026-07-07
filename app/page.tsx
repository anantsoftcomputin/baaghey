"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Mail,
  Phone,
  X,
} from "lucide-react";
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
import { campaigns, categories, products, stories, type Campaign, type Category, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { StoreHeader } from "@/components/StoreHeader";

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
  const [showSplash, setShowSplash] = useState(true);
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
    const timer = window.setTimeout(() => setShowSplash(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

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

  const productsByCategory = useMemo(() => {
    return [...catalogCategories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        ...category,
        products: activeProducts.filter((product) => product.category === category.id),
      }))
      .filter((category) => category.products.length);
  }, [activeProducts, catalogCategories]);

  const liveCampaign = useMemo(
    () => catalogCampaigns.find((campaign) => campaign.active),
    [catalogCampaigns],
  );

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
    <main className="min-h-screen bg-[#fffdf1] text-ink">
      {showSplash && <Splash />}

      <StoreHeader count={activeProducts.length} />

      <section className="relative min-h-[100svh] overflow-hidden bg-neem pt-28 text-[#fffdf1]">
        <Image
          src="/images/baagay-shirt-hero.png"
          alt="Modern Bandhani shirts on a rail"
          fill
          priority
          className="object-cover opacity-72"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78),rgba(78,106,49,0.58),rgba(0,0,0,0.08))]" />
        <div className="absolute bottom-0 left-0 right-0 grid grid-cols-4">
          <span className="h-3 bg-neem" />
          <span className="h-3 bg-gulal" />
          <span className="h-3 bg-kesar" />
          <span className="h-3 bg-ink" />
        </div>
        <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-[1500px] items-center px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_0.75fr] lg:px-10">
          <div className="max-w-4xl">
            <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={116} height={116} className="mb-8 size-24 rounded-full shadow-textile sm:size-28" />
            <p className="mb-5 inline-flex rounded-full bg-kesar px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-ink">
              Modern Bandhani · Gujarat
            </p>
            <h1 className="font-display text-6xl font-bold leading-[0.88] tracking-normal sm:text-8xl lg:text-9xl">
              The legacy of the knot, reimagined.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#fffdf1]/86">
              Contemporary Bandhej shirts, shirt dresses, and overshirts made with the restraint of modern fashion and the soul of Gujarati hand craft.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-kesar px-6 text-sm font-black uppercase tracking-[0.16em] text-ink">
                Shop now <ArrowRight size={17} />
              </Link>
              <a href="#craft" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#fffdf1]/45 px-6 text-sm font-black uppercase tracking-[0.16em]">
                Know the Bandhej
              </a>
            </div>
          </div>
          <div className="hidden self-end rounded-[24px] border border-[#fffdf1]/25 bg-black/28 p-5 backdrop-blur lg:block">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-kesar">Season note</p>
            <h2 className="mt-3 font-display text-4xl font-bold">Festive, but never costume.</h2>
            <p className="mt-3 text-sm leading-7 text-[#fffdf1]/75">
              Designed for people who wear heritage naturally: over denim, under a jacket, at garba, at brunch, and everywhere between.
            </p>
          </div>
        </div>
      </section>

      <section id="collections" className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10">
        <div className="glass-card grid md:grid-cols-4">
          {catalogCategories.map((category) => (
            <Link key={category.id} href={`/shop?category=${category.id}`} className="group min-h-44 border-b border-white/35 p-5 md:border-b-0 md:border-r">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-neem">Category</p>
              <h2 className="mt-8 font-display text-4xl font-bold tracking-normal">{category.name}</h2>
              <p className="mt-3 text-sm leading-6 text-black/62">{category.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-gulal">
                Explore <ArrowRight size={15} />
              </span>
            </Link>
          ))}
          <a href="#journal" className="group min-h-44 rounded-[20px] bg-ink p-5 text-[#fffdf1] md:rounded-l-none">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-kesar">Editorial</p>
            <h2 className="mt-8 font-display text-4xl font-bold tracking-normal">Craft journal</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Stories from Jamnagar, Porbandar, Veraval, and the tied dot.</p>
          </a>
        </div>
      </section>

      <section id="shop" className="heritage-bg relative px-4 py-20 sm:px-6 lg:px-10">
        <div className="jali-arch -right-24 top-20 hidden lg:block" />
        <div className="relative z-10 mx-auto max-w-[1500px]">
        <div className="mb-10 flex flex-col justify-between gap-5 border-b border-black/10 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-gulal">Shop by category</p>
            <h2 className="mt-2 font-display text-6xl font-bold tracking-normal">Bandhej for now.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-black/62">A quick preview of the catalog. Use the dedicated shop page for filters, sorting, and deeper product discovery.</p>
        </div>

        <div className="grid gap-16">
          {productsByCategory.map((category, index) => (
            <section id={category.id} key={category.id} className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="lg:sticky lg:top-32 lg:h-fit">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-neem">0{index + 1}</p>
                <h3 className="mt-3 font-display text-5xl font-bold tracking-normal">{category.name}</h3>
                <p className="mt-4 text-sm leading-7 text-black/62">{category.description}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
        </div>
      </section>

      <section id="craft" className="bg-neem py-20 text-[#fffdf1]">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.2fr] lg:px-10">
          <div>
            <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={92} height={92} className="mb-8 size-20 rounded-full" />
            <p className="text-xs font-black uppercase tracking-[0.26em] text-kesar">Print nathi, Bandhej che</p>
            <h2 className="mt-3 font-display text-6xl font-bold leading-none tracking-normal">A commerce site with a craft spine.</h2>
            <p className="mt-6 text-base leading-8 text-white/75">
              Inspired by the category clarity of Tribes India and the heritage editorial pace of The Jodhpore, BAAGAY keeps product discovery clean while letting Gujarat show up in color, craft, and rhythm.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {stories.map((story) => (
              <article key={story.city} className="glass-card bg-black/12 p-5 text-[#fffdf1]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-kesar">{story.city}</p>
                <h3 className="mt-8 font-display text-3xl font-bold">{story.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/70">{story.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="journal" className="mx-auto grid max-w-[1500px] gap-5 px-4 py-20 sm:px-6 lg:grid-cols-3 lg:px-10">
        <EditorialCard title="The Kamal shirt" copy="A relaxed shape, small tied dots, and a color story that moves from craft to street." tone="bg-gulal" />
        <EditorialCard title="Bandhej in black" copy="The palette brings black into the system so heritage has a sharper modern anchor." tone="bg-ink text-[#fffdf1]" />
        <EditorialCard title="Festive sale tools" copy="Run Navratri, Diwali, or wedding-season edits from the admin campaign manager." tone="bg-kesar" />
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-20 sm:px-6 lg:px-10">
        <div className="glass-card grid gap-8 p-6 md:grid-cols-[0.8fr_1.2fr] md:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-gulal">Private preview</p>
            <h2 className="mt-3 font-display text-6xl font-bold leading-none tracking-normal">Reserve a hand-tied piece.</h2>
          </div>
          <div className="grid gap-3">
            <input className="h-12 border border-black/15 bg-[#fffdf1] px-4 text-sm outline-none" placeholder="Name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
            <input className="h-12 border border-black/15 bg-[#fffdf1] px-4 text-sm outline-none" placeholder="Email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
            <select className="h-12 border border-black/15 bg-[#fffdf1] px-4 text-sm outline-none" value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
              {activeProducts.map((product) => (
                <option key={product.id}>{product.name}</option>
              ))}
            </select>
            <textarea className="min-h-24 border border-black/15 bg-[#fffdf1] p-4 text-sm outline-none" placeholder="Sizing, occasion, or styling note" value={form.note} onChange={(event) => updateForm("note", event.target.value)} />
            <button className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-5 text-sm font-black uppercase tracking-[0.18em] text-kesar disabled:opacity-60" disabled={!firebaseReady} onClick={handleWishlistLead}>
              Save request <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-ink px-4 py-12 text-[#fffdf1] sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1500px] gap-10 md:grid-cols-[1fr_2fr_1fr]">
          <div>
            <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={94} height={94} className="size-20 rounded-full" />
            <p className="mt-4 font-display text-4xl font-bold">BAAGAY</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Bandhani Shirts", "Shirt Dresses", "Overshirts"].map((item) => (
              <a key={item} className="border border-white/15 p-4 text-sm font-black uppercase tracking-[0.16em] text-white/75" href="#shop">
                {item}
              </a>
            ))}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-kesar">Newsletter</p>
            <p className="mt-3 text-sm leading-7 text-white/64">Festive edits, fresh drops, and craft stories from Gujarat.</p>
          </div>
        </div>
      </footer>

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

function EditorialCard({ title, copy, tone }: { title: string; copy: string; tone: string }) {
  return (
    <article className={`${tone} min-h-80 p-6`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] opacity-70">BAAGAY journal</p>
      <h3 className="mt-20 font-display text-5xl font-bold leading-none tracking-normal">{title}</h3>
      <p className="mt-4 max-w-sm text-sm leading-7 opacity-70">{copy}</p>
    </article>
  );
}

function Splash() {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-neem text-kesar">
      <div className="absolute inset-0 splash-weave opacity-55" />
      <div className="relative grid place-items-center">
        <svg className="h-[260px] w-[320px] sm:h-[360px] sm:w-[520px]" viewBox="0 0 520 360" aria-hidden="true">
          <path className="stitch-path" d="M42 210 C120 70 205 286 272 142 C340 -2 436 162 478 84" fill="none" stroke="#FEEC6D" strokeWidth="7" strokeLinecap="round" strokeDasharray="12 18" />
          <path className="thread-path" d="M42 210 C120 70 205 286 272 142 C340 -2 436 162 478 84" fill="none" stroke="#F4898B" strokeWidth="2" />
          <g className="needle">
            <path d="M0 -32 L8 28 L0 42 L-8 28 Z" fill="#fffdf1" />
            <circle cx="0" cy="-18" r="4" fill="#000000" />
          </g>
        </svg>
        <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={176} height={176} className="absolute size-36 rounded-full shadow-textile sm:size-44" />
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <aside className="ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#fffdf1] p-6 shadow-textile" onClick={(event) => event.stopPropagation()}>
        <button className="ml-auto grid size-10 place-items-center border border-black/15" onClick={onClose}>
          <X size={18} />
        </button>
        <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={84} height={84} className="mt-4 size-20 rounded-full" />
        <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-gulal">BAAGAY account</p>
        <h2 className="mt-2 font-display text-5xl font-bold tracking-normal">Join the atelier list.</h2>
        <div className="mt-6 grid grid-cols-3 border border-black/10 text-sm font-black">
          {(["email", "google", "phone"] as AuthMode[]).map((item) => (
            <button key={item} className={`h-12 capitalize ${mode === item ? "bg-ink text-kesar" : "bg-white"}`} onClick={() => onMode(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-3">
          {mode !== "google" && <input className="h-12 border border-black/15 bg-white px-4 text-sm outline-none" placeholder="Name" value={form.name} onChange={(event) => onForm("name", event.target.value)} />}
          {mode === "email" && (
            <>
              <input className="h-12 border border-black/15 bg-white px-4 text-sm outline-none" placeholder="Email" value={form.email} onChange={(event) => onForm("email", event.target.value)} />
              <input className="h-12 border border-black/15 bg-white px-4 text-sm outline-none" placeholder="Password" type="password" value={form.password} onChange={(event) => onForm("password", event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <button disabled={!firebaseReady} className="auth-button" onClick={() => onEmailAuth("register")}>
                  <Mail size={17} /> Register
                </button>
                <button disabled={!firebaseReady} className="auth-button secondary" onClick={() => onEmailAuth("login")}>
                  Login
                </button>
              </div>
            </>
          )}
          {mode === "google" && (
            <button disabled={!firebaseReady} className="auth-button" onClick={onGoogle}>
              <Mail size={17} /> Continue with Google
            </button>
          )}
          {mode === "phone" && (
            <>
              <input className="h-12 border border-black/15 bg-white px-4 text-sm outline-none" placeholder="+91 phone number" value={form.phone} onChange={(event) => onForm("phone", event.target.value)} />
              <button disabled={!firebaseReady} className="auth-button" onClick={onSendOtp}>
                <Phone size={17} /> Send OTP
              </button>
              <input className="h-12 border border-black/15 bg-white px-4 text-sm outline-none" placeholder="OTP" value={form.otp} onChange={(event) => onForm("otp", event.target.value)} />
              <button disabled={!firebaseReady || !confirmation} className="auth-button secondary" onClick={onConfirmOtp}>
                Verify OTP
              </button>
            </>
          )}
          <div id="recaptcha-container" />
          {status && <p className="border border-black/10 bg-white p-3 text-sm text-black/72">{status}</p>}
        </div>
      </aside>
    </div>
  );
}
