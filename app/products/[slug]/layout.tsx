import type { Metadata } from "next";
import { productPhoto, productSlug } from "@/lib/catalog";
import { serverProducts } from "@/lib/catalog-server";

async function findProduct(slug: string) {
  return (await serverProducts()).find((item) => productSlug(item) === slug);
}

function shareablePhoto(photo?: string) {
  return photo && !photo.startsWith("data:") ? photo : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const description = product.description ?? product.craft;
  const photo = shareablePhoto(productPhoto(product));
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: { type: "website", title: product.name, description, images: photo ? [{ url: photo, alt: product.name }] : [] },
    twitter: { card: "summary_large_image", title: product.name, description, images: photo ? [photo] : [] },
  };
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProduct(slug);
  const photo = product && shareablePhoto(productPhoto(product));
  const jsonLd = product ? {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description ?? product.craft, image: photo ? [photo] : undefined, sku: product.sku,
    brand: { "@type": "Brand", name: "BAAGAY" },
    offers: { "@type": "Offer", priceCurrency: "INR", price: product.salePrice ?? product.price, availability: product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `/products/${slug}` },
  } : null;
  return <>{jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}{children}</>;
}
