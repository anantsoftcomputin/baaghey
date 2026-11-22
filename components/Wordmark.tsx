/** The BAAGAY wordmark: बागेय set heavy, framed by three tied-dot diamonds
 * (top-left, right, and beneath) as on the brand board. */
export function Wordmark({
  tone = "yellow",
  className = "",
  as: Tag = "span",
}: {
  tone?: "yellow" | "green" | "white";
  className?: string;
  as?: "span" | "p" | "h1" | "h2";
}) {
  const text = { yellow: "text-yellow", green: "text-green", white: "text-white" }[tone];
  const dot = tone === "green" ? "#F2E46B" : "#F4898B";
  return (
    <Tag className={`relative inline-block font-deva font-extrabold leading-none ${text} ${className}`} aria-label="BAAGAY" role="img">
      <span aria-hidden="true" className="relative inline-block px-[0.32em] pb-[0.2em] pt-[0.12em]">
        बागेय
        <Diamond color={dot} className="left-0 top-[0.06em] h-[0.3em] w-[0.3em]" />
        <Diamond color={dot} className="right-0 top-[0.42em] h-[0.3em] w-[0.3em]" />
        <Diamond color={dot} className="bottom-0 left-[46%] h-[0.3em] w-[0.3em]" />
      </span>
    </Tag>
  );
}

/** A single Bandhani tie: a diamond with the pale centre left by the knot. */
export function Diamond({ color = "#F4898B", className = "" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`absolute ${className}`} aria-hidden="true">
      <path d="M10 1 19 10 10 19 1 10Z" fill={color} />
      <circle cx="10" cy="10" r="3.2" fill="#fff" fillOpacity="0.9" />
    </svg>
  );
}
