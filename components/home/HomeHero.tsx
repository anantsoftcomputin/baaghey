"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { SITE_MEDIA } from "@/lib/site";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Full-bleed campaign image with the brand promise and one call to action. */
export function HomeHero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);
  const played = useRef(false);

  useGSAP(() => {
    if (!ready || played.current) return;
    played.current = true;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.timeline({ defaults: { ease: "expo.out" } })
        .from("[data-hero-img]", { scale: 1.18, duration: 2.4, stagger: 0.1 })
        .from("[data-hero-cta]", { y: 20, autoAlpha: 0, duration: 1.2 }, 0.8);
      gsap.to("[data-hero-layer]", { yPercent: 14, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [ready] });

  const [left, right] = SITE_MEDIA.hero;
  return (
    <section ref={root} className="relative h-[82svh] min-h-[520px] overflow-hidden bg-green lg:h-[94svh]">
      <div data-hero-layer className="absolute inset-0 flex">
        <div className="relative h-full flex-1 overflow-hidden">
          <Image data-hero-img src={left} alt="BAAGAY Bandhani dress against a painted seaside backdrop" fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-[center_24%]" />
        </div>
        {right && (
          <div className="relative hidden h-full flex-1 overflow-hidden md:block">
            <Image data-hero-img src={right} alt="BAAGAY Bandhani overshirt against a painted seaside backdrop" fill priority sizes="50vw" className="object-cover object-[center_24%]" />
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />
      <div data-hero-cta className="gutter absolute inset-x-0 bottom-[10%] flex flex-col items-center text-center text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">Hand-tied in Gujarat</p>
        <h1 className="mt-3 max-w-3xl text-balance text-[28px] font-semibold uppercase leading-[1.1] tracking-[0.06em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-[40px] lg:text-[52px]">Bandhani, cut for every day</h1>
        <Link href="/shop" className="btn mt-7 bg-white text-ink hover:bg-yellow">Shop the collection</Link>
      </div>
    </section>
  );
}
