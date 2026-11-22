"use client";

import { useState } from "react";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeIntro } from "@/components/home/HomeIntro";
import { HomeHero } from "@/components/home/HomeHero";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CraftBand } from "@/components/home/CraftBand";
import { AboutBlock } from "@/components/home/AboutBlock";
import { Testimonials } from "@/components/home/Testimonials";
import { useCatalog } from "@/hooks/useCatalog";

export default function Home() {
  const [ready, setReady] = useState(false);
  const { activeProducts, categories } = useCatalog();

  return (
    <main className="min-h-screen overflow-x-clip">
      <HomeIntro onDone={() => setReady(true)} />
      <StoreHeader overlay />
      <HomeHero ready={ready} />
      <FeaturedCollection />
      <CategoryGrid categories={categories} products={activeProducts} />
      <CraftBand />
      <AboutBlock />
      <Testimonials />
      <SiteFooter />
    </main>
  );
}
