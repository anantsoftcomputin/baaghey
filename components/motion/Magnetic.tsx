"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** Gently pulls its child toward a fine pointer. No-op on touch devices. */
export function Magnetic({ children, strength = 0.28, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const x = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const y = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const move = (event: PointerEvent) => {
        const box = el.getBoundingClientRect();
        x((event.clientX - box.left - box.width / 2) * strength);
        y((event.clientY - box.top - box.height / 2) * strength);
      };
      const leave = () => { x(0); y(0); };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
    });
    return () => mm.revert();
  }, { scope: ref });
  return <span ref={ref} className={`inline-block ${className}`}>{children}</span>;
}
