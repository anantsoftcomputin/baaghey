/*
  A thin ribbon of the hand-painted BAAGAY artwork (from the brand thank-you
  card), used as a section divider — like a strip of printed fabric laid
  across the page. Keep it short so it reads as trim, not wallpaper.
*/
export function ArtBand({ className = "h-14 sm:h-16" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`w-full bg-[url('/brand/baagay-artwork.jpg')] bg-cover bg-center ${className}`}
    />
  );
}
