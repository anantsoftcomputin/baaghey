import type { CSSProperties, ReactNode } from "react";

/*
  Hand-drawn folk / craft line motifs, in the spirit of Okhai's background art.
  Every motif draws with `currentColor` and thin strokes — some solid, some
  dashed to read as a running (kantha) stitch. Set colour + opacity from the
  parent (e.g. `text-neem opacity-[0.12]`) and size/position with className.
*/

type MotifProps = { className?: string; style?: CSSProperties };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function PeacockMotif({ className, style }: MotifProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} {...base}>
      {/* body + neck */}
      <path d="M52 92 C48 78 46 64 52 54 C56 47 64 45 70 49 C74 52 74 58 70 60 C66 62 61 60 61 55" />
      <circle cx="66" cy="45" r="2.2" fill="currentColor" stroke="none" />
      <path d="M69 44 l7 -5" />
      {/* fan of feathers */}
      <path d="M52 60 C30 52 20 34 22 16" />
      <path d="M55 58 C40 44 36 26 44 10" />
      <path d="M58 57 C54 40 58 24 68 14" />
      <path d="M61 58 C66 42 78 30 92 26" />
      <path d="M62 62 C78 56 94 44 100 30" />
      <circle cx="22" cy="16" r="3" strokeDasharray="1.5 2.5" />
      <circle cx="44" cy="10" r="3" strokeDasharray="1.5 2.5" />
      <circle cx="68" cy="14" r="3" strokeDasharray="1.5 2.5" />
      <circle cx="92" cy="26" r="3" strokeDasharray="1.5 2.5" />
      <circle cx="100" cy="30" r="3" strokeDasharray="1.5 2.5" />
      {/* legs */}
      <path d="M52 92 l-3 10 M58 92 l2 10" />
    </svg>
  );
}

export function ElephantMotif({ className, style }: MotifProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} {...base}>
      <path d="M24 78 C20 58 30 40 52 38 C74 36 92 48 92 68 C92 76 88 82 82 84" />
      <path d="M92 66 C100 62 104 66 100 72 C97 76 92 76 90 72" />
      {/* trunk */}
      <path d="M26 78 C18 82 16 92 22 98 C26 102 32 100 32 94 C32 90 28 90 28 93" />
      {/* ear */}
      <path d="M52 44 C42 44 38 56 44 64 C50 70 58 66 58 58" strokeDasharray="2 3" />
      <circle cx="70" cy="56" r="1.8" fill="currentColor" stroke="none" />
      {/* legs */}
      <path d="M40 84 l0 12 M56 86 l0 12 M74 84 l0 12 M86 82 l0 12" />
      {/* decorative back blanket */}
      <path d="M50 40 C60 34 74 36 82 46" strokeDasharray="1.5 2.5" />
    </svg>
  );
}

export function ButterflyMotif({ className, style }: MotifProps) {
  return (
    <svg viewBox="0 0 140 90" className={className} style={style} {...base}>
      {/* body */}
      <path d="M40 30 C40 44 40 54 42 62" />
      <path d="M40 28 l-5 -8 M40 28 l5 -8" />
      {/* wings */}
      <path d="M40 34 C24 18 6 20 8 36 C9 48 26 50 40 42" strokeDasharray="2 3" />
      <path d="M40 44 C26 52 12 62 20 72 C28 80 40 68 41 58" strokeDasharray="2 3" />
      <path d="M42 34 C58 18 76 20 74 36 C73 48 56 50 42 42" />
      <path d="M42 44 C56 52 70 62 62 72 C54 80 42 68 41 58" />
      <circle cx="24" cy="34" r="2" fill="currentColor" stroke="none" />
      <circle cx="58" cy="34" r="2" fill="currentColor" stroke="none" />
      {/* trailing dotted thread */}
      <path d="M74 40 C92 46 110 40 128 52" strokeDasharray="1 5" strokeWidth={1.6} />
      <path d="M128 52 l6 -3 M128 52 l1 6" />
    </svg>
  );
}

export function VineMotif({ className, style }: MotifProps) {
  return (
    <svg viewBox="0 0 160 70" className={className} style={style} {...base}>
      <path d="M4 40 C40 10 80 60 120 26 C136 12 150 20 156 34" />
      {/* leaves */}
      <path d="M34 30 C30 20 38 16 44 22 C48 26 44 34 36 34" />
      <path d="M70 44 C66 54 74 58 80 52 C84 48 80 40 72 40" />
      <path d="M108 30 C104 20 112 16 118 22 C122 26 118 34 110 34" />
      {/* dotted tendrils */}
      <path d="M20 38 C10 34 8 26 14 22" strokeDasharray="1 4" />
      <path d="M140 30 C150 34 152 42 146 46" strokeDasharray="1 4" />
    </svg>
  );
}

export function ButiMotif({ className, style }: MotifProps) {
  // A bandhani flower buti — petals of tied dots around a center.
  return (
    <svg viewBox="0 0 80 80" className={className} style={style} {...base}>
      <circle cx="40" cy="40" r="4.5" />
      <circle cx="40" cy="40" r="1.6" fill="currentColor" stroke="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        const x = 40 + Math.cos(r) * 20;
        const y = 40 + Math.sin(r) * 20;
        return <circle key={a} cx={x} cy={y} r="3.4" strokeDasharray="1.5 2.5" />;
      })}
      <circle cx="40" cy="40" r="30" strokeDasharray="1 5" />
    </svg>
  );
}

export function DotClusterMotif({ className, style }: MotifProps) {
  // A scattered, organic cluster of tied dots.
  const dots = [
    [20, 22, 3], [40, 16, 2.4], [58, 26, 3.2], [30, 40, 2.6], [50, 44, 3],
    [16, 52, 2.2], [40, 60, 3.4], [62, 54, 2.6], [26, 70, 2.4], [50, 74, 2.8],
  ];
  return (
    <svg viewBox="0 0 80 90" className={className} style={style} {...base}>
      {dots.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} />
          <circle cx={x} cy={y} r={0.8} fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

export function FolkFigureMotif({ className, style }: MotifProps) {
  // A stylised veiled woman figure, like the Okhai "empowerment" mark.
  return (
    <svg viewBox="0 0 80 120" className={className} style={style} {...base}>
      <path d="M40 14 C30 14 26 22 28 30 C24 34 22 42 24 50 L24 74 C24 78 28 80 32 80 L48 80 C52 80 56 78 56 74 L56 50 C58 42 56 34 52 30 C54 22 50 14 40 14 Z" />
      <path d="M28 30 C34 34 46 34 52 30" strokeDasharray="1.5 2.5" />
      <circle cx="40" cy="26" r="1.6" fill="currentColor" stroke="none" />
      <path d="M24 56 L18 96 M56 56 L62 96" />
      <path d="M32 80 L30 108 M48 80 L50 108" />
      <path d="M28 44 C36 48 44 48 52 44" strokeDasharray="1.5 2.5" />
      <path d="M30 64 C38 68 42 68 50 64" strokeDasharray="1.5 2.5" />
    </svg>
  );
}

export function BirdMotif({ className, style }: MotifProps) {
  return (
    <svg viewBox="0 0 90 70" className={className} style={style} {...base}>
      <path d="M18 44 C20 30 32 24 46 26 C58 28 66 36 66 44 C66 52 58 56 50 54" />
      <path d="M46 26 l8 -8" />
      <circle cx="40" cy="34" r="1.6" fill="currentColor" stroke="none" />
      <path d="M30 44 C40 40 54 42 62 50 C54 52 44 50 38 46" strokeDasharray="2 3" />
      <path d="M24 52 l-2 10 M32 54 l0 10" />
    </svg>
  );
}

/*
  A decorative background layer that scatters a few motifs across a section.
  Drop it as the first child of a `relative` section. Purely decorative.
  Pass a `variant` for a different arrangement, or `tone` for the ink colour.
*/
type FieldProps = {
  variant?: "a" | "b" | "c";
  className?: string;
  tone?: string; // tailwind text-* colour class
};

export function MotifField({ variant = "a", className = "", tone = "text-neem" }: FieldProps) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${tone} ${className}`}>
      {variant === "a" && (
        <>
          <PeacockMotif className="absolute -left-6 top-10 w-40 opacity-[0.10] -rotate-6" />
          <VineMotif className="absolute right-4 top-24 w-56 opacity-[0.09]" />
          <DotClusterMotif className="absolute bottom-8 left-1/3 w-20 opacity-[0.10]" />
          <ButterflyMotif className="absolute right-10 bottom-16 w-40 opacity-[0.09] rotate-6" />
        </>
      )}
      {variant === "b" && (
        <>
          <ElephantMotif className="absolute left-8 bottom-10 w-40 opacity-[0.09]" />
          <ButiMotif className="absolute right-12 top-12 w-24 opacity-[0.12]" />
          <VineMotif className="absolute -left-8 top-1/2 w-52 opacity-[0.08] rotate-3" />
          <BirdMotif className="absolute right-1/4 bottom-24 w-28 opacity-[0.10] -rotate-3" />
        </>
      )}
      {variant === "c" && (
        <>
          <FolkFigureMotif className="absolute left-10 top-16 w-24 opacity-[0.10]" />
          <BirdMotif className="absolute right-16 top-24 w-32 opacity-[0.10]" />
          <DotClusterMotif className="absolute right-1/3 bottom-10 w-20 opacity-[0.10]" />
          <ButiMotif className="absolute left-1/4 bottom-16 w-20 opacity-[0.12]" />
        </>
      )}
    </div>
  );
}

export function StitchDivider({ className = "", tone = "text-neem" }: { className?: string; tone?: string }) {
  // A running-stitch zig-zag rule, echoing the seam under Okhai's nav.
  return (
    <div aria-hidden className={`w-full ${tone} ${className}`}>
      <svg viewBox="0 0 40 8" preserveAspectRatio="none" className="h-2 w-full" style={{ display: "block" }}>
        <defs>
          <pattern id="stitchzz" width="16" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 6 L8 2 L16 6" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="2.5 2" />
          </pattern>
        </defs>
        <rect width="40" height="8" fill="url(#stitchzz)" />
      </svg>
    </div>
  );
}

export function MotifRule({ children }: { children?: ReactNode }) {
  return children ?? null;
}
