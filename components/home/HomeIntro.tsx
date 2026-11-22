"use client";

import { useRef } from "react";
import { Wordmark } from "@/components/Wordmark";
import { gsap, useGSAP } from "@/lib/gsap";

/** A once-per-session curtain: the wordmark rises on brand green and the
 * curtain lifts. Calls `onDone` immediately when it is not shown. */
export function HomeIntro({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const html = document.documentElement;
    if (!html.classList.contains("intro") || !root.current) { onDone(); return; }
    try { sessionStorage.setItem("baagay-intro", "1"); } catch { /* private mode */ }
    gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: () => html.classList.remove("intro") })
      .from("[data-intro-word]", { yPercent: 110, duration: 1.1 }, 0.15)
      .from("[data-intro-word] svg", { scale: 0, rotation: 90, duration: 0.8, stagger: 0.12, ease: "back.out(2)" }, 0.6)
      .to("[data-intro-word]", { yPercent: -110, duration: 0.7, ease: "expo.in" }, 1.6)
      .to(root.current, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, 1.9)
      .call(onDone, [], 2.1);
  }, { scope: root });

  return (
    <div ref={root} className="home-intro fixed inset-0 z-[100] place-items-center overflow-hidden bg-green" aria-hidden="true">
      <div className="overflow-hidden px-4 py-2">
        <div data-intro-word><Wordmark tone="yellow" className="text-[26vw] sm:text-[11rem]" /></div>
      </div>
    </div>
  );
}
