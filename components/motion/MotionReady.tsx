"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/** Tells the failsafe in app/layout.tsx that hydration happened, and keeps
 * ScrollTrigger measurements correct once fonts and images settle. */
export function MotionReady() {
  useEffect(() => {
    (window as Window & { __motionReady?: boolean }).__motionReady = true;
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);
  return null;
}
