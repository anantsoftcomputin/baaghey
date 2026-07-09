"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Facebook, MessageCircle, Send, Share2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { StoreHeader } from "@/components/StoreHeader";
import { BottomNav } from "@/components/BottomNav";
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
      <main className="min-h-screen pb-24 text-black lg:pb-0">
        <StoreHeader />
        <section className="container-max px-4 pt-40 sm:px-6 lg:px-10">
          <h1 className="text-5xl font-bold">Product not found.</h1>
          <Link href="/shop" className="mt-8 inline-flex h-12 items-center bg-green px-5 text-sm font-bold uppercase tracking-[0.1em] text-white">
            Back to shop
          </Link>
        </section>
        <BottomNav />
      </main>
    );
  }

  const productUrl = `${origin}${productHref(product)}`;
  const shareText = `Shop ${product.name} from BAAGAY`;
  const related = products
    .filter((item) => item.status === "active" && item.category === product.category && item.id !== product.id)
    .slice(0, 3);

  return (
    <main className="min-h-screen pb-24 text-black lg:pb-0">
      <StoreHeader count={products.filter((item) => item.status === "active").length} />

      <section className="container-max grid gap-8 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Link href="/shop" className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-mute">
            <ArrowLeft size={15} /> Back to shop
          </Link>
          <div
            className="aspect-[4/5] border border-line bg-[#f4f4f4]"
            style={{ ...productImageStyle(product), backgroundSize: "cover", backgroundPosition: "center" }}
          />
        </div>

        <div className="lg:pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-mute">{product.material}</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-5 text-2xl font-bold">
            {product.salePrice ? (
              <>
                <span className="text-pink-dark">{formatPrice(product.salePrice)}</span>
                <span className="ml-3 text-lg text-faint line-through">{formatPrice(product.price)}</span>
              </>
            ) : (
              formatPrice(product.price)
            )}
          </p>
          <p className="mt-6 max-w-xl text-base leading-7 text-mute">{product.description ?? product.craft}</p>

          <div className="mt-8 border-y border-line py-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-mute">Select size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`grid size-12 place-items-center border text-sm font-bold ${selectedSize === size ? "border-green bg-green text-white" : "border-line bg-white"}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 hidden gap-3 sm:grid-cols-2 lg:grid">
            <button className="h-12 border border-green bg-white text-sm font-bold uppercase tracking-[0.1em] text-green-dark">Add to cart</button>
            <button className="h-12 bg-green text-sm font-bold uppercase tracking-[0.1em] text-white">Buy now</button>
          </div>

          <div className="mt-8 grid gap-5 border border-line p-5">
            <Info title="Product details" copy={product.details ?? product.craft} />
            <Info title="Fabric care" copy={product.care ?? "Hand wash separately in cold water. Dry in shade."} />
            <Info title="Stock" copy={product.inventory > 0 ? `${product.inventory} pieces available. Selected size: ${selectedSize}.` : "Sold out"} />
          </div>

          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-mute">Share this product</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ShareLink href={`https://wa.me/?text=${encodeURIComponent(`${shareText}: ${productUrl}`)}`} label="WhatsApp" icon={<MessageCircle size={16} />} />
              <ShareLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`} label="Facebook" icon={<Facebook size={16} />} />
              <ShareLink href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`} label="X" icon={<Send size={16} />} />
              <button
                className="inline-flex h-11 items-center gap-2 border border-line px-4 text-xs font-bold uppercase tracking-[0.08em]"
                onClick={() => navigator.share ? navigator.share({ title: product.name, text: shareText, url: productUrl }) : navigator.clipboard.writeText(productUrl)}
              >
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-max px-4 pb-20 sm:px-6 lg:px-10">
          <div className="mb-6 border-b border-line pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">More from this collection</p>
            <h2 className="mt-2 text-3xl font-bold">You may also like</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-mute">Price</p>
            <p className="font-bold leading-tight">
              {product.salePrice ? (
                <>
                  <span className="text-pink-dark">{formatPrice(product.salePrice)}</span>
                  <span className="ml-1.5 text-xs text-faint line-through">{formatPrice(product.price)}</span>
                </>
              ) : (
                formatPrice(product.price)
              )}
            </p>
          </div>
          <button className="h-12 flex-1 border border-green text-xs font-bold uppercase tracking-[0.08em] text-green-dark">Add to cart</button>
          <button className="h-12 flex-1 bg-green text-xs font-bold uppercase tracking-[0.08em] text-white">Buy now</button>
        </div>
      </div>
    </main>
  );
}

function Info({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-mute">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-black">{copy}</p>
    </div>
  );
}

function ShareLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 border border-line px-4 text-xs font-bold uppercase tracking-[0.08em]">
      {icon} {label}
    </a>
  );
}
