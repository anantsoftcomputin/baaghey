"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { bandhaniSteps, campaigns, categories, products, stories, type Campaign, type Category, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { StoreHeader } from "@/components/StoreHeader";
import { BottomNav } from "@/components/BottomNav";
import { ValuesStrip } from "@/components/ValuesStrip";
import { MotifField, StitchDivider } from "@/components/Motifs";

const SPLASH_SESSION_KEY = "baagay-splash-shown";

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
  const [showSplash, setShowSplash] = useState(false);
  const splashDoneRef = useRef(false);
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

  const finishSplash = useCallback(() => {
    if (splashDoneRef.current) return;
    splashDoneRef.current = true;
    try {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable (e.g. private mode) — splash just replays, no big deal
    }
    setShowSplash(false);
  }, []);

  // Splash is a first-visit-of-the-session moment, not something to replay every
  // time someone lands back on "/". Defaults to hidden (matches the server
  // render) and only turns on once we confirm, client-side, that this session
  // hasn't seen it yet — so repeat visits never even flash it.
  useLayoutEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = Boolean(window.sessionStorage.getItem(SPLASH_SESSION_KEY));
    } catch {
      alreadySeen = false;
    }
    if (alreadySeen) {
      splashDoneRef.current = true;
    } else {
      setShowSplash(true);
    }
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
    <main className="min-h-screen text-ink">
      {showSplash && <Splash onFinish={finishSplash} />}

      <StoreHeader count={activeProducts.length} />

      <section className="relative min-h-[100svh] overflow-hidden bg-neem pt-28 text-[#fffdf1]">
        <Image
          src="/images/baagay-shirt-hero.png"
          alt="Modern Bandhani shirts on a rail"
          fill
          priority
          className="object-cover opacity-72"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(32,45,26,0.72),rgba(78,106,49,0.34)_52%,rgba(78,106,49,0.05))]" />
        <StitchDivider tone="text-kesar" className="absolute bottom-0 left-0 right-0 z-10" />
        <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-[1500px] items-center px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_0.75fr] lg:px-10">
          <div className="max-w-4xl">
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

      <ValuesStrip />

      <StitchDivider tone="text-neem/40" className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10" />

      <section id="collections" className="relative mx-auto max-w-[1500px] px-4 py-14 sm:px-6 lg:px-10">
        <MotifField variant="a" tone="text-neem" />
        <div className="glass-card relative grid md:grid-cols-4">
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

      <section id="shop" className="relative px-4 py-20 sm:px-6 lg:px-10">
        <MotifField variant="b" tone="text-neem" />
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
              <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-3">
                {category.products.map((product) => (
                  <div key={product.id} className="w-[78vw] shrink-0 snap-start sm:w-auto sm:shrink sm:snap-align-none">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-black/35 sm:hidden">Swipe for more →</p>
            </section>
          ))}
        </div>
        </div>
      </section>

      <section id="craft" className="relative overflow-hidden bg-[#f6efdd]/70 py-20 text-mehendi">
        <MotifField variant="c" tone="text-neem" />
        <div className="relative mx-auto grid max-w-[1500px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.2fr] lg:px-10">
          <div>
            <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={92} height={92} className="mb-8 size-20 rounded-full" />
            <p className="text-xs font-black uppercase tracking-[0.26em] text-sindoor">Print nathi, Bandhej che</p>
            <h2 className="mt-3 font-display text-6xl font-bold leading-none tracking-normal text-mehendi">Five thousand years, tied by hand.</h2>
            <p className="mt-6 text-base leading-8 text-mehendi/75">
              Bandhani is one of the oldest resist-dye crafts on earth, practised across Kutch and Saurashtra for centuries. Every dot you see was pinched and knotted by an artisan before the cloth was ever dyed — which is why the pattern breathes, and why no two of our pieces are truly identical.
            </p>
            <p className="mt-4 text-base leading-8 text-mehendi/75">
              We cut that living craft into shirts, overshirts and dresses you can actually wear out — heritage kept honest, worn easy.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {stories.map((story) => (
              <article key={story.city} className="rounded-[20px] border border-mehendi/12 bg-white/70 p-5 shadow-[0_10px_40px_rgba(34,56,35,0.06)] backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-sindoor">{story.city}</p>
                <h3 className="mt-8 font-display text-3xl font-bold text-mehendi">{story.title}</h3>
                <p className="mt-4 text-sm leading-7 text-mehendi/70">{story.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="craft-process" className="relative mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-10">
        <MotifField variant="a" tone="text-neem" />
        <div className="relative mb-12 flex flex-col justify-between gap-5 border-b border-black/10 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-gulal">How Bandhani is made</p>
            <h2 className="mt-2 font-display text-6xl font-bold tracking-normal">Tie. Dye. Reveal.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-black/62">
            The word <em>bandhani</em> comes from <em>bandhan</em> — to tie. Here is the same four-step ritual our artisans follow, from a plain length of cloth to a field of hand-tied dots.
          </p>
        </div>
        <div className="relative grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {bandhaniSteps.map((step, index) => (
            <article key={step.step} className="glass-card flex flex-col rounded-[22px] p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-5xl font-bold text-neem/40">{step.step}</span>
                <StepIcon index={index} />
              </div>
              <p className="mt-6 font-display text-3xl font-bold leading-none text-neem">{step.gujarati}</p>
              <h3 className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-ink">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-black/62">{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="journal" className="relative mx-auto max-w-[1500px] px-4 pb-20 sm:px-6 lg:px-10">
        <MotifField variant="b" tone="text-neem" />
        <div className="relative mb-10 border-b border-black/10 pb-6">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-sindoor">BAAGAY journal</p>
          <h2 className="mt-2 font-display text-6xl font-bold tracking-normal text-mehendi">Notes from the knot.</h2>
        </div>
        <div className="relative grid gap-5 lg:grid-cols-3">
          <EditorialCard title="The Kamal shirt" copy="A relaxed camp collar, lotus-vine ties, and a madder red that moves easily from a garba night to a Sunday lunch." accent="gulal" />
          <EditorialCard title="Bandhej in black" copy="Raat brings black into a festive craft — the same hand-tied dots, lit with gold, for a sharper modern evening." accent="ink" />
          <EditorialCard title="From coast to city" copy="Kutch dyes, Saurashtra sun, and shapes cut for denim and daylight. Heritage you can wear on an ordinary Tuesday." accent="kesar" />
        </div>
      </section>

      <section className="relative mx-auto max-w-[1500px] px-4 pb-20 sm:px-6 lg:px-10">
        <MotifField variant="c" tone="text-neem" />
        <div className="glass-card relative grid gap-8 p-6 md:grid-cols-[0.8fr_1.2fr] md:p-10">
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

      <footer className="bg-ink px-4 py-12 pb-24 text-[#fffdf1] sm:px-6 lg:px-10 lg:pb-12">
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

const EDITORIAL_ACCENTS: Record<string, { bar: string; kicker: string }> = {
  gulal: { bar: "bg-gulal", kicker: "text-gulal" },
  ink: { bar: "bg-ink", kicker: "text-ink" },
  kesar: { bar: "bg-brass", kicker: "text-brass" },
};

function EditorialCard({ title, copy, accent }: { title: string; copy: string; accent: string }) {
  const a = EDITORIAL_ACCENTS[accent] ?? EDITORIAL_ACCENTS.gulal;
  return (
    <article className="flex min-h-72 flex-col rounded-[20px] border border-mehendi/12 bg-white/70 p-6 shadow-[0_10px_40px_rgba(34,56,35,0.06)] backdrop-blur-sm">
      <span className={`h-1.5 w-12 rounded-full ${a.bar}`} />
      <p className={`mt-5 text-xs font-black uppercase tracking-[0.24em] ${a.kicker}`}>Journal</p>
      <h3 className="mt-auto pt-10 font-display text-4xl font-bold leading-none tracking-normal text-mehendi">{title}</h3>
      <p className="mt-4 max-w-sm text-sm leading-7 text-mehendi/70">{copy}</p>
    </article>
  );
}

// Small hand-drawn craft marks for the tie -> dye -> reveal steps.
function StepIcon({ index }: { index: number }) {
  const common = {
    width: 40,
    height: 40,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "#4E6A31",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (index === 0) {
    // Bind — a pinched point cinched with thread
    return (
      <svg {...common}>
        <path d="M20 5 C13 12 13 20 20 24 C27 20 27 12 20 5 Z" />
        <path d="M14 24 h12 M13 28 h14 M15 32 h10" />
        <circle cx="20" cy="14" r="2.4" fill="#F4898B" stroke="none" />
      </svg>
    );
  }
  if (index === 1) {
    // Dye — a droplet meeting the vat
    return (
      <svg {...common}>
        <path d="M20 5 C25 13 29 17 29 23 a9 9 0 0 1 -18 0 C11 17 15 13 20 5 Z" fill="rgba(159,48,44,0.14)" />
        <path d="M14 22 q6 4 12 0" />
      </svg>
    );
  }
  if (index === 2) {
    // Dry — coastal sun
    return (
      <svg {...common}>
        <circle cx="20" cy="20" r="6.5" fill="rgba(247,219,84,0.35)" />
        <path d="M20 4 v4 M20 32 v4 M4 20 h4 M32 20 h4 M8.5 8.5 l2.8 2.8 M28.7 28.7 l2.8 2.8 M31.5 8.5 l-2.8 2.8 M11.3 28.7 l-2.8 2.8" />
      </svg>
    );
  }
  // Reveal — the knot opened into a bloomed dot
  return (
    <svg {...common}>
      <circle cx="20" cy="20" r="12" />
      <circle cx="20" cy="20" r="6.5" />
      <circle cx="20" cy="20" r="2.4" fill="#9f302c" stroke="none" />
    </svg>
  );
}

function Splash({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const fallback = window.setTimeout(onFinish, 10800);
    return () => window.clearTimeout(fallback);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-ink">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/create_a_logo_reveal_with_bhan.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onFinish}
      />
      <div className="absolute inset-0 bg-black/10" />
      <Image
        src="/brand/baagay-logo.svg"
        alt="BAAGAY logo"
        width={160}
        height={160}
        className="splash-video-fallback relative size-32 rounded-full sm:size-40"
      />
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
