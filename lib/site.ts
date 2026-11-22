/**
 * Editorial media and contact details for the storefront. Swap these paths for
 * the final campaign photography (drop files in /public/images) without touching
 * any component.
 */
export const SITE_MEDIA = {
  /** Home hero: shown side by side so the painted backdrop reads as one scene. */
  hero: ["/images/products/neel-teal-dress.jpeg", "/images/products/kantha-olive-overshirt.jpeg"],
  /** Featured collection: the "changing picture" cycles through these. */
  featured: ["/images/products/sugandha-yellow-dress.jpeg", "/images/products/gulaal-pink-dress.jpeg", "/images/products/raat-black-dress.jpeg"],
  /** Craft band: ideally an artisan's hands tying Bandhani. */
  craft: "/images/bandhani-hero.png",
  /** Footer backdrop painting. */
  footer: "/brand/baagay-artwork.jpg",
  /** Wordmark colour over the footer art: "green" suits a light painting (as on
   * the brand board); "yellow" reads on the current green garden artwork. */
  footerWordmark: "yellow" as "green" | "yellow",
};

export const FEATURED_COLLECTION = {
  title: "BAAGAY Festive'26 | Collection",
  copy: "Hand-tied Bandhani in festive madder, haldi and gulabi — cut into easy shirts, drapes and dresses for long celebrations and the quiet mornings after.",
  href: "/shop",
};

export const CONTACT = {
  email: "hello@baagay.in",
  /** International format without "+", e.g. 919876543210. Leave empty to hide WhatsApp. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
};

export const SHIPS_IN = "2 weeks";

export type Testimonial = { quote: string; name: string; place?: string };

/** Real customer words only. While empty, the section is hidden in production
 * and shows a layout placeholder in development. */
export const TESTIMONIALS: Testimonial[] = [];
