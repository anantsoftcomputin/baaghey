import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";

/** Page opening in the board's voice: a small bold title, optional count/eyebrow and lede. */
export function PageIntro({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div>
      <Reveal as="h1" className="page-title">{title}</Reveal>
      {eyebrow && <Reveal as="p" className="mt-2 text-[11px] uppercase tracking-[0.12em] text-mute">{eyebrow}</Reveal>}
      {children && <Reveal className="mt-4 max-w-xl text-[13px] leading-6 text-ink/70">{children}</Reveal>}
    </div>
  );
}
