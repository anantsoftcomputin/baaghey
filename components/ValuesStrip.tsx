/*
  The brand-values strip, in the spirit of Okhai — five hand-stitched folk
  icons over an airy ground. Each icon is drawn with a running-stitch (dashed)
  line in a muted craft colour.
*/

const stitch = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.6,
  "aria-hidden": true,
};

function WomenIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" stroke="#9f302c" {...stitch}>
      <path d="M32 8 C24 8 20 15 22 22 C18 26 17 33 19 40 L19 46 C15 50 12 58 12 58 L52 58 C52 58 49 50 45 46 L45 40 C47 33 46 26 42 22 C44 15 40 8 32 8 Z" strokeDasharray="2.5 2.5" />
      <path d="M22 22 C28 26 36 26 42 22" strokeDasharray="2 2" />
      <circle cx="32" cy="19" r="1.6" fill="#9f302c" stroke="none" />
      <path d="M20 40 C28 44 36 44 44 40" strokeDasharray="2 2" />
      <path d="M24 50 C30 53 34 53 40 50" strokeDasharray="2 2" />
      <path d="M19 46 L14 58 M45 46 L50 58" strokeDasharray="2.5 2.5" />
    </svg>
  );
}

function CircularIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" stroke="#177f7c" {...stitch}>
      <path d="M20 20 C14 26 14 36 22 42" strokeDasharray="2.5 2.5" />
      <path d="M22 42 l-6 -1 l1 7" />
      <path d="M44 44 C50 38 50 28 42 22" strokeDasharray="2.5 2.5" />
      <path d="M42 22 l6 1 l-1 -7" />
      <path d="M24 18 C30 15 38 16 42 22" strokeDasharray="2.5 2.5" />
      <path d="M40 46 C34 49 26 48 22 42" strokeDasharray="2.5 2.5" />
    </svg>
  );
}

function SustainableIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" stroke="#4E6A31" {...stitch}>
      <path d="M32 56 L32 26" strokeDasharray="2.5 2.5" />
      <path d="M32 34 C24 34 16 28 16 18 C26 18 33 24 33 33" strokeDasharray="2.5 2.5" />
      <path d="M32 40 C40 40 48 34 48 24 C38 24 31 30 31 39" strokeDasharray="2.5 2.5" />
      <path d="M32 26 C32 20 34 14 40 10" strokeDasharray="2 2" />
    </svg>
  );
}

function HeirloomIcon() {
  // A four-point bandhani / cross buti, drawn as tied clusters.
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" stroke="#203a63" {...stitch}>
      <path d="M32 14 L32 50 M14 32 L50 32" strokeDasharray="2 3" />
      {[
        [32, 14], [32, 50], [14, 32], [50, 32], [32, 32],
        [22, 22], [42, 22], [22, 42], [42, 42],
      ].map(([x, y], i) => (
        <g key={i}>
          <path
            d={`M${x} ${y - 4} L${x + 4} ${y} L${x} ${y + 4} L${x - 4} ${y} Z`}
            fill={i % 2 ? "#203a63" : "none"}
          />
        </g>
      ))}
    </svg>
  );
}

function ReturnsIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" stroke="#b9883d" {...stitch}>
      <path d="M24 26 L32 22 L40 26 L40 38 L32 42 L24 38 Z" strokeDasharray="2.5 2.5" />
      <path d="M24 26 L32 30 L40 26 M32 30 L32 42" strokeDasharray="2 2" />
      <path d="M18 20 C26 12 38 12 46 18" strokeDasharray="2.5 2.5" />
      <path d="M46 18 l1 -6 l-6 2" />
      <path d="M46 44 C38 52 26 52 18 46" strokeDasharray="2.5 2.5" />
      <path d="M18 46 l-1 6 l6 -2" />
    </svg>
  );
}

const VALUES = [
  { icon: <WomenIcon />, label: "Women Empowerment" },
  { icon: <CircularIcon />, label: "Circular Fashion" },
  { icon: <SustainableIcon />, label: "Sustainable" },
  { icon: <HeirloomIcon />, label: "Heirloom Crafts" },
  { icon: <ReturnsIcon />, label: "Easy Returns" },
];

export function ValuesStrip() {
  return (
    <section className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10">
      <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
        {VALUES.map((value) => (
          <div key={value.label} className="flex flex-col items-center gap-3 text-center">
            {value.icon}
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-mehendi/80 sm:text-sm">{value.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
