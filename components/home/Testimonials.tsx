"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TESTIMONIALS, type Testimonial } from "@/lib/site";
import { Diamond } from "@/components/Wordmark";
import { Reveal } from "@/components/motion/Reveal";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

// Shown only in development so the layout can be reviewed before real reviews exist.
const LAYOUT_SAMPLE: Testimonial[] = [{ quote: "Sample review — add real customer words to TESTIMONIALS in lib/site.ts. This placeholder never appears in production.", name: "Layout preview" }];

export function Testimonials() {
  const items = TESTIMONIALS.length ? TESTIMONIALS : process.env.NODE_ENV === "production" ? [] : LAYOUT_SAMPLE;
  const [index, setIndex] = useState(0);
  const slide = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!slide.current || !window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(slide.current, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "expo.out" });
  }, { dependencies: [index] });

  if (!items.length) return null;
  const item = items[index % items.length];
  const go = (step: number) => setIndex((current) => (current + step + items.length) % items.length);

  return (
    <section className="container-max gutter pb-24 lg:pb-32">
      <Reveal as="h2" className="section-title">What people say about us</Reveal>
      <div className="mt-10 grid grid-cols-[40px_1fr_40px] items-center">
        <button onClick={() => go(-1)} aria-label="Previous review" disabled={items.length < 2} className="grid size-10 place-items-center"><ChevronLeft size={18} strokeWidth={1.5} /></button>
        <div ref={slide} className="mx-auto max-w-xl text-center" aria-live="polite">
          <div className="flex justify-center gap-1.5" aria-label="5 out of 5">
            {Array.from({ length: 5 }, (_, star) => <span key={star} className="relative size-3.5"><Diamond className="inset-0 size-3.5" /></span>)}
          </div>
          <blockquote className="mt-5 text-[13px] leading-6 text-ink/80">{item.quote}</blockquote>
          <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-mute">{item.name}{item.place ? `, ${item.place}` : ""}</p>
        </div>
        <button onClick={() => go(1)} aria-label="Next review" disabled={items.length < 2} className="grid size-10 place-items-center"><ChevronRight size={18} strokeWidth={1.5} /></button>
      </div>
    </section>
  );
}
