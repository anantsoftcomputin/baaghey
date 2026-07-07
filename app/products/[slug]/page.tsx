"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Facebook, MessageCircle, Send, Share2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { StoreHeader } from "@/components/StoreHeader";
import { formatPrice, productHref, productImageStyle, productSlug } from "@/lib/catalog";
import { firebaseReady, subscribeProducts } from "@/lib/firebase";
import { products as seedProducts, type Product } from "@/lib/products";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [selectedSize, setSelectedSize] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    if (!firebaseReady) return;
    return subscribeProducts((items) => items.length && setProducts(items));
  }, []);

  const product = useMemo(
    () => products.find((item) => productSlug(item) === params.slug || item.id === params.slug),
    [params.slug, products],
  );

  useEffect(() => {
    if (product?.sizes?.length) setSelectedSize(product.sizes[0]);
  }, [product]);

  if (!product) {
    return (
      <main className="min-h-screen bg-[#fffdf1] text-ink">
        <StoreHeader />
        <section className="mx-auto max-w-[900px] px-4 pt-40 sm:px-6 lg:px-10">
          <h1 className="font-display text-6xl font-bold">Product not found.</h1>
          <Link href="/shop" className="mt-8 inline-flex h-12 items-center bg-ink px-5 text-sm font-black uppercase tracking-[0.16em] text-kesar">
            Back to shop
          </Link>
        </section>
      </main>
    );
  }

  const productUrl = `${origin}${productHref(product)}`;
  const shareText = `Shop ${product.name} from BAAGAY`;
  const related = products
    .filter((item) => item.status === "active" && item.category === product.category && item.id !== product.id)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#fffdf1] text-ink">
      <StoreHeader count={products.filter((item) => item.status === "active").length} />

      <section className="mx-auto grid max-w-[1500px] gap-8 px-4 pb-16 pt-36 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div>
          <Link href="/shop" className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-black/60">
            <ArrowLeft size={15} /> Back to shop
          </Link>
          <div className="glass-card sticky top-32 aspect-[4/5] bg-cover bg-center" style={productImageStyle(product)}>
            {!product.imageDataUrl && <div className="absolute inset-0 bandhani-dots opacity-65" />}
          </div>
        </div>

        <div className="lg:pt-10">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-neem">{product.material}</p>
          <h1 className="mt-3 font-display text-6xl font-bold leading-none tracking-normal sm:text-7xl">{product.name}</h1>
          <p className="mt-5 text-3xl font-black">
            {product.salePrice ? (
              <>
                {formatPrice(product.salePrice)}
                <span className="ml-3 text-lg text-black/35 line-through">{formatPrice(product.price)}</span>
              </>
            ) : (
              formatPrice(product.price)
            )}
          </p>
          <p className="mt-6 max-w-xl text-base leading-8 text-black/68">{product.description ?? product.craft}</p>

          <div className="mt-8 border-y border-black/10 py-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-black/55">Select size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`grid size-12 place-items-center border text-sm font-black ${selectedSize === size ? "border-ink bg-ink text-kesar" : "border-black/15 bg-white"}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button className="h-12 rounded-full bg-kesar text-sm font-black uppercase tracking-[0.16em] text-ink">Add to cart</button>
            <button className="h-12 rounded-full bg-ink text-sm font-black uppercase tracking-[0.16em] text-kesar">Buy now</button>
          </div>

          <div className="glass-card mt-8 grid gap-4 p-5">
            <Info title="Product details" copy={product.details ?? product.craft} />
            <Info title="Fabric care" copy={product.care ?? "Hand wash separately in cold water. Dry in shade."} />
            <Info title="Stock" copy={product.inventory > 0 ? `${product.inventory} pieces available. Selected size: ${selectedSize}.` : "Sold out"} />
          </div>

          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-black/55">Share this product</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ShareLink href={`https://wa.me/?text=${encodeURIComponent(`${shareText}: ${productUrl}`)}`} label="WhatsApp" icon={<MessageCircle size={16} />} />
              <ShareLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`} label="Facebook" icon={<Facebook size={16} />} />
              <ShareLink href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`} label="X" icon={<Send size={16} />} />
              <button
                className="glass-control inline-flex h-11 items-center gap-2 px-4 text-xs font-black uppercase tracking-[0.14em]"
                onClick={() => navigator.share ? navigator.share({ title: product.name, text: shareText, url: productUrl }) : navigator.clipboard.writeText(productUrl)}
              >
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-4 pb-20 sm:px-6 lg:px-10">
          <div className="mb-6 border-b border-black/10 pb-4">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-gulal">More from this collection</p>
            <h2 className="mt-2 font-display text-5xl font-bold">You may also like</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Info({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neem">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-black/66">{copy}</p>
    </div>
  );
}

function ShareLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="glass-control inline-flex h-11 items-center gap-2 px-4 text-xs font-black uppercase tracking-[0.14em]">
      {icon} {label}
    </a>
  );
}
