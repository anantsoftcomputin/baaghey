"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Soft cross-page fade. Opacity only: a transform here would become the
 * containing block for fixed and pinned descendants and break them. */
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out", clearProps: "opacity" });
  });
  return <div ref={ref}>{children}</div>;
}
