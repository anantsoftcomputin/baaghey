import { describe, expect, it } from "vitest";
import { awaitingPayment, cartQuantity, cartSubtotal, effectivePrice, findCampaign, FREE_SHIPPING_AT, holdsStock, orderTotals, shippingFor, STANDARD_SHIPPING, type CartItem } from "./commerce";
import type { Product } from "./products";

const items: CartItem[] = [
  { productId: "one", category: "shirts", name: "One", slug: "one", size: "M", price: 1200, quantity: 2 },
  { productId: "two", category: "dresses", name: "Two", slug: "two", size: "S", price: 900, quantity: 1 },
];

describe("commerce totals", () => {
  it("calculates line totals and unit count", () => {
    expect(cartSubtotal(items)).toBe(3300);
    expect(cartQuantity(items)).toBe(3);
  });

  it("charges no shipping on an empty bag", () => {
    expect(shippingFor(0)).toBe(0);
  });

  it("applies free shipping at the configured threshold", () => {
    expect(shippingFor(FREE_SHIPPING_AT - 1)).toBe(STANDARD_SHIPPING);
    expect(shippingFor(FREE_SHIPPING_AT)).toBe(0);
  });

  it("uses the sale price when present", () => {
    expect(effectivePrice({ price: 1000, salePrice: 800 } as Product)).toBe(800);
    expect(effectivePrice({ price: 1000 } as Product)).toBe(1000);
  });
});

describe("promotions", () => {
  const campaign = { id: "c", name: "Edit", code: "RAAS15", discountPercent: 15, startsAt: "2026-09-20", endsAt: "2026-10-05", active: true, appliesTo: ["shirts"] };

  it("finds a live code case-insensitively and rejects expired or inactive ones", () => {
    expect(findCampaign([campaign], " raas15 ", "2026-10-01")).toBe(campaign);
    expect(findCampaign([campaign], "RAAS15", "2026-10-06")).toBeNull();
    expect(findCampaign([{ ...campaign, active: false }], "RAAS15", "2026-10-01")).toBeNull();
  });

  it("discounts only eligible categories and bases shipping on the pre-discount subtotal", () => {
    const shirtsOnly: CartItem[] = [
      { productId: "s", category: "shirts", name: "Shirt", slug: "s", size: "M", price: 2000, quantity: 1 },
      { productId: "d", category: "dresses", name: "Dress", slug: "d", size: "S", price: 1500, quantity: 1 },
    ];
    expect(orderTotals(shirtsOnly, campaign)).toEqual({ subtotal: 3500, discount: 300, shipping: 0, total: 3200 });
    expect(orderTotals(shirtsOnly, null).discount).toBe(0);
  });
});

describe("order status rules", () => {
  it("holds stock only while an order can still ship", () => {
    expect(["pending_payment", "payment_failed", "paid", "fulfilled"].every((status) => holdsStock(status as never))).toBe(true);
    expect(["abandoned", "cancelled", "refunded"].some((status) => holdsStock(status as never))).toBe(false);
  });

  it("never lets a late payment event overwrite fulfilment or a refund", () => {
    expect(awaitingPayment("abandoned")).toBe(true);
    expect(awaitingPayment("fulfilled")).toBe(false);
    expect(awaitingPayment("refunded")).toBe(false);
    expect(awaitingPayment("cancelled")).toBe(false);
  });
});
