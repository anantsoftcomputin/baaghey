import type { Metadata, Viewport } from "next";
import { Anek_Devanagari, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { CommerceProvider } from "@/components/CommerceProvider";
import { AuthDialog } from "@/components/AuthDialog";
import { BagDrawer } from "@/components/BagDrawer";
import { QuickView } from "@/components/QuickView";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BottomNav } from "@/components/BottomNav";
import { MotionReady } from "@/components/motion/MotionReady";
import { CatalogProvider } from "@/hooks/useCatalog";
import { catalogSnapshot } from "@/lib/catalog-server";

const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", weight: ["300", "400", "500", "600", "700"] });
const devanagari = Anek_Devanagari({ subsets: ["devanagari"], variable: "--font-deva", weight: ["700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "BAAGAY | Modern Bandhani", template: "%s | BAAGAY" },
  description:
    "Modern handcrafted Bandhani shirts, dresses and overshirts from Gujarat.",
  icons: { icon: "/brand/baagay-logo.svg", apple: "/brand/baagay-logo.svg" },
  openGraph: {
    type: "website",
    siteName: "BAAGAY",
    title: "BAAGAY | Modern Bandhani",
    description: "Contemporary hand-tied Bandhani clothing, made across Kutch and Saurashtra.",
    images: [{ url: "/images/baagay-shirt-hero.png", width: 1600, height: 1200, alt: "BAAGAY Bandhani shirts" }],
  },
  twitter: { card: "summary_large_image", title: "BAAGAY | Modern Bandhani", images: ["/images/baagay-shirt-hero.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the bottom bar sit above the iPhone home indicator via env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: "#4E6A31",
};

// Hide scroll-reveal content only when motion is welcome, and queue the home
// intro once per session; if hydration never happens, show everything after a
// moment rather than leave the page blank.
const motionScript = `(function(){try{if(matchMedia('(prefers-reduced-motion: no-preference)').matches){var d=document.documentElement;d.classList.add('motion');if(location.pathname==='/'&&!sessionStorage.getItem('baagay-intro'))d.classList.add('intro');setTimeout(function(){if(!window.__motionReady)d.classList.remove('motion','intro')},4000)}}catch(e){}})()`;

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const catalog = await catalogSnapshot().catch(() => undefined);
  return (
    <html lang="en" className={`${sans.variable} ${devanagari.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body className="bg-white font-sans text-ink antialiased">
        <CatalogProvider initial={catalog}>
        <CommerceProvider>
          {children}
          {modal}
          <QuickView />
          <BagDrawer />
          <WhatsAppButton />
          <BottomNav />
          <AuthDialog />
          <MotionReady />
        </CommerceProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
