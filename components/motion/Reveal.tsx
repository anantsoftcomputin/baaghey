"use client";

import { useRef, type ElementType, type ReactNode, type ComponentPropsWithoutRef } from "react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";

type Variant = "up" | "lines" | "words" | "image" | "fade";

type RevealProps<T extends ElementType> = {
  as?: T;
  variant?: Variant;
  delay?: number;
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

/** Scroll-triggered entrance. Elements stay fully visible when the visitor
 * prefers reduced motion or before JavaScript runs (see app/layout.tsx). */
export function Reveal<T extends ElementType = "div">({ as, variant = "up", delay = 0, immediate = false, children, ...rest }: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute("data-revealed", "");
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const scrollTrigger = immediate ? undefined : { trigger: el, start: "top 88%", once: true };
      if (variant === "lines" || variant === "words") {
        // autoSplit re-splits after web fonts load or the width changes, so line breaks stay true.
        const split = SplitText.create(el, {
          type: variant === "lines" ? "lines" : "words,lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => gsap.from(variant === "lines" ? self.lines : self.words, { yPercent: 110, duration: 1.25, stagger: variant === "lines" ? 0.09 : 0.035, delay, scrollTrigger }),
        });
        return () => split.revert();
      }
      if (variant === "image") {
        const media = el.querySelector("img, video");
        const tl = gsap.timeline({ delay, scrollTrigger });
        tl.from(el, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" });
        if (media) tl.from(media, { scale: 1.25, duration: 1.8, ease: "expo.out" }, 0);
        return;
      }
      gsap.fromTo(el, { autoAlpha: 0, y: variant === "fade" ? 0 : 36 }, { autoAlpha: 1, y: 0, duration: 1.2, delay, scrollTrigger });
    });
    return () => mm.revert();
  }, { scope: ref });

  return <Tag ref={ref} data-reveal="" {...rest}>{children}</Tag>;
}
