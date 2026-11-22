"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { SITE_MEDIA } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

export function CraftBand() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo("[data-craft-img]", { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: "[data-craft-frame]", start: "top bottom", end: "bottom top", scrub: true } });
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section ref={root} id="craft" className="scroll-mt-24 pb-20 lg:pb-28">
      <div className="container-max gutter"><Reveal as="h2" className="section-title">Craft</Reveal></div>
      <Reveal variant="image" className="mt-5">
        <div data-craft-frame className="relative aspect-[16/9] overflow-hidden bg-cream sm:aspect-[21/8]">
          <div data-craft-img className="absolute inset-[-12%_0]">
            <Image src={SITE_MEDIA.craft} alt="Bandhani cloth, tied and dyed by hand" fill sizes="100vw" className="object-cover" />
          </div>
        </div>
      </Reveal>
      <div className="container-max gutter mx-auto mt-10 max-w-md text-center">
        <Reveal as="h3" className="label">Bandhani</Reveal>
        <Reveal as="p" className="mt-4 text-[13px] leading-6 text-ink/75">From the Sanskrit <em>bandh</em>, to tie. Artisans across Kutch and Saurashtra pinch the cloth into thousands of tiny points, bind each with thread, then dye it — every dot you see is a knot that held the colour back.</Reveal>
        <Reveal><Link href="/collections" className="text-link mt-6">Read more</Link></Reveal>
      </div>
    </section>
  );
}
