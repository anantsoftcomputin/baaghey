import type { Metadata, Viewport } from "next";
import { Anek_Devanagari } from "next/font/google";
import "./globals.css";

const sans = Anek_Devanagari({
  subsets: ["latin", "devanagari"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BAAGAY | Modern Bandhani Shirts",
  description:
    "Modern handcrafted Bandhani shirts, dresses and overshirts from Gujarat.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} font-sans bg-white text-black antialiased`}>{children}</body>
    </html>
  );
}
