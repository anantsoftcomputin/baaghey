import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageIntro } from "@/components/PageIntro";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = { title: "Journal", description: "Stories about Bandhej, colour, silhouettes, and the hands behind BAAGAY.", alternates: { canonical: "/journal" } };

const articles = [
  { id: "kamal-shirt", kicker: "Silhouette", title: "The Kamal shirt", intro: "A relaxed camp collar, lotus-vine ties, and a madder red that moves easily from a garba night to a Sunday lunch.", body: "Kamal means lotus. Across soft mulmul, the artisan ties a running bel so each opened knot reads like a petal. We kept the cut loose and the collar easy, allowing the density of the hand work to carry the piece.", tone: "text-pink-dark" },
  { id: "bandhej-in-black", kicker: "Colour", title: "Bandhej in black", intro: "Raat brings black into a festive craft — the same hand-tied dots, lit with gold, for a sharper modern evening.", body: "Bandhani is often remembered in ceremonial reds and yellows. Black changes its register. The small chaubundi constellations become graphic, the silhouette becomes evening wear, and the living irregularity of every knot remains visible up close.", tone: "text-yellow-dark" },
  { id: "coast-to-city", kicker: "Place", title: "From coast to city", intro: "Kutch dyes, Saurashtra sun, and shapes cut for denim and daylight.", body: "The cloth begins with hands, thread, dye and weather. Our role is to cut it without disguising that origin: camp shirts, overshirts and dresses that carry regional knowledge into an ordinary contemporary wardrobe.", tone: "text-green" },
];

export default function JournalPage() {
  return (
    <main className="min-h-screen">
      <StoreHeader />
      <section className="container-max gutter pb-12 pt-[124px]">
        <PageIntro eyebrow="The BAAGAY journal" title="Notes from the knot." />
      </section>
      <section className="container-max gutter pb-28">
        {articles.map((article, index) => (
          <article id={article.id} key={article.id} className="scroll-mt-32 border-t border-ink/15 py-14 lg:grid lg:grid-cols-[0.5fr_1fr] lg:gap-16">
            <Reveal>
              <p className={` ${article.tone} text-[28px] font-light`}>0{index + 1}</p>
              <p className="eyebrow mt-6 text-mute">{article.kicker}</p>
              <h2 className="mt-3 text-[22px] font-semibold uppercase tracking-[0.1em]">{article.title}</h2>
            </Reveal>
            <div className="mt-6 lg:mt-0">
              <Reveal as="p" variant="lines" className="text-[15px] font-semibold uppercase tracking-[0.1em] text-[20px] font-light">{article.intro}</Reveal>
              <Reveal as="p" className="mt-6 max-w-2xl text-[16px] leading-8 text-ink/70">{article.body}</Reveal>
              <Reveal><Link href="/shop" className="btn btn-outline mt-8">Explore the collection <ArrowUpRight size={15} /></Link></Reveal>
            </div>
          </article>
        ))}
      </section>
      <SiteFooter />
    </main>
  );
}
