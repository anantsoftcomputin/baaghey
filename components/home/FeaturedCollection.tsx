"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FEATURED_COLLECTION, SITE_MEDIA } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Image left, story right; the picture changes on its own, as sketched on the board. */
export function FeaturedCollection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const slides = gsap.utils.toArray<HTMLElement>("[data-slide]");
    if (slides.length < 2) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.set(slides.slice(1), { autoAlpha: 0 });
      const tl = gsap.timeline({ repeat: -1, paused: true });
      slides.forEach((slide, index) => {
        const next = slides[(index + 1) % slides.length];
        tl.to(slide, { autoAlpha: 0, duration: 1.2, ease: "power2.inOut" }, "+=3.4")
          .fromTo(next, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 1.6, ease: "power2.out" }, "<");
      });
      // Only cycle while the section is on screen.
      gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", onToggle: (self) => (self.isActive ? tl.play() : tl.pause()) } });
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section ref={root} className="container-max gutter grid items-center gap-10 py-20 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:gap-16 lg:py-28">
      <Reveal variant="image" className="relative aspect-[4/5] overflow-hidden bg-cream">
        {SITE_MEDIA.featured.map((src, index) => (
          <div key={src} data-slide className="absolute inset-0">
            <Image src={src} alt="" fill priority={index === 0} sizes="(max-width: 768px) 100vw, 45vw" className="object-cover object-[center_22%]" />
          </div>
        ))}
      </Reveal>
      <div className="max-w-sm md:mx-auto">
        <Reveal as="h2" className="section-title">{FEATURED_COLLECTION.title}</Reveal>
        <Reveal as="p" className="mt-4 text-[13px] leading-6 text-ink/75">{FEATURED_COLLECTION.copy}</Reveal>
        <Reveal><Link href={FEATURED_COLLECTION.href} className="text-link mt-6">View collection</Link></Reveal>
      </div>
    </section>
  );
}
