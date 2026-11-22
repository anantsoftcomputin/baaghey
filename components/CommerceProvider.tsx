"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, ensureUserProfile, loadUserCommerce, saveUserCart, saveUserWishlist } from "@/lib/firebase";
import { cartQuantity, cartSubtotal, type CartItem } from "@/lib/commerce";
import type { Product } from "@/lib/products";
import { effectivePrice } from "@/lib/commerce";
import { productPhoto, productSlug } from "@/lib/catalog";

type CommerceContextValue = {
  user: User | null;
  authReady: boolean;
  authOpen: boolean;
  bagOpen: boolean;
  /** Product shown in the quick-view pop-up, if any. */
  quickViewId: string | null;
  openQuickView: (productId: string) => void;
  closeQuickView: () => void;
  openBag: () => void;
  closeBag: () => void;
  openAuth: () => void;
  closeAuth: () => void;
  logout: () => Promise<void>;
  cart: CartItem[];
  /** False until the saved bag has been read from this device. */
  cartReady: boolean;
  cartCount: number;
  subtotal: number;
  addToCart: (product: Product, size: string, quantity?: number) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);
const CART_KEY = "baagay_cart_v1";
const WISHLIST_KEY = "baagay_wishlist_v1";

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);

  useEffect(() => {
    setCart(readStored(CART_KEY, []));
    setWishlist(readStored(WISHLIST_KEY, []));
    setStorageReady(true);
    if (!auth) {
      setAuthReady(true);
      return;
    }
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setRemoteReady(false);
      setCloudSyncEnabled(false);
      try {
        if (nextUser) {
          await ensureUserProfile(nextUser);
          const remote = await loadUserCommerce(nextUser.uid);
          setCloudSyncEnabled(remote.cloudAvailable);
          setCart((local) => {
            const merged = [...local];
            for (const item of remote.cart) if (!merged.some((entry) => entry.productId === item.productId && entry.size === item.size)) merged.push(item);
            return merged;
          });
          setWishlist((local) => Array.from(new Set([...local, ...remote.wishlist])));
        }
      } catch (error) {
        console.warn("BAAGAY cloud cart sync is unavailable; using local storage.", error);
      } finally {
        setRemoteReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (storageReady) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    if (storageReady && remoteReady && cloudSyncEnabled && user) void saveUserCart(user.uid, cart).catch(() => setCloudSyncEnabled(false));
  }, [cart, cloudSyncEnabled, remoteReady, storageReady, user]);

  useEffect(() => {
    if (storageReady) window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    if (storageReady && remoteReady && cloudSyncEnabled && user) void saveUserWishlist(user.uid, wishlist).catch(() => setCloudSyncEnabled(false));
  }, [cloudSyncEnabled, remoteReady, storageReady, user, wishlist]);

  const addToCart = useCallback((product: Product, size: string, quantity = 1) => {
    setCart((current) => {
      const index = current.findIndex((item) => item.productId === product.id && item.size === size);
      if (index >= 0) {
        return current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, quantity: Math.min(10, item.quantity + quantity) } : item,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          category: product.category,
          name: product.name,
          slug: productSlug(product),
          ...(productPhoto(product) ? { photo: productPhoto(product) } : {}),
          size,
          price: effectivePrice(product),
          quantity: Math.min(10, Math.max(1, quantity)),
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId || item.size !== size));
      return;
    }
    setCart((current) =>
      current.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: Math.min(10, quantity) }
          : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((productId: string, size: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId || item.size !== size));
  }, []);

  const openBag = useCallback(() => setBagOpen(true), []);
  const closeBag = useCallback(() => setBagOpen(false), []);
  const openQuickView = useCallback((productId: string) => setQuickViewId(productId), []);
  const closeQuickView = useCallback(() => setQuickViewId(null), []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  }, []);

  const value = useMemo<CommerceContextValue>(() => ({
    user,
    authReady,
    authOpen,
    bagOpen,
    quickViewId,
    openQuickView,
    closeQuickView,
    openBag,
    closeBag,
    openAuth: () => setAuthOpen(true),
    closeAuth: () => setAuthOpen(false),
    logout: async () => {
      if (auth) await signOut(auth);
    },
    cart,
    cartReady: storageReady,
    cartCount: cartQuantity(cart),
    subtotal: cartSubtotal(cart),
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart: () => setCart([]),
    wishlist,
    toggleWishlist,
    isWishlisted: (productId) => wishlist.includes(productId),
  }), [addToCart, authOpen, authReady, bagOpen, closeBag, closeQuickView, openBag, openQuickView, quickViewId, cart, removeFromCart, storageReady, toggleWishlist, updateQuantity, user, wishlist]);

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used within CommerceProvider");
  return context;
}
