/** A hairline Mughal pointed arch (jharokha), drawn as linework around a photo
 * rather than cut out of it. Stretches to its box; strokes stay hairline. */
export function ArchOutline({ className = "" }: { className?: string }) {
  const outer = "M1,159 L1,58 C1,32 20,19 36,12 C43,9 47,5 50,1 C53,5 57,9 64,12 C80,19 99,32 99,58 L99,159";
  const inner = "M5,159 L5,60 C5,36 23,24 38,17 C44,14 48,10 50,6 C52,10 56,14 62,17 C77,24 95,36 95,60 L95,159";
  return (
    <svg viewBox="0 0 100 160" preserveAspectRatio="none" className={className} aria-hidden="true" fill="none">
      <path d={`${outer} Z`} fill="#FBF8F1" fillOpacity="0.75" />
      <path data-arch-line d={outer} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" pathLength={1} />
      <path data-arch-line d={inner} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" pathLength={1} />
    </svg>
  );
}
