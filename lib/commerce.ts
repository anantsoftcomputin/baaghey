import type { Campaign, Product } from "./products";

export type CartItem = {
  productId: string;
  category: string;
  name: string;
  slug: string;
  photo?: string;
  size: string;
  price: number;
  quantity: number;
};

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
};

export type CommerceOrder = {
  id: string;
  uid?: string | null;
  customer: CheckoutCustomer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  campaignCode?: string;
  shipping: number;
  total: number;
  currency: "INR";
  status: "pending_payment" | "paid" | "payment_failed" | "abandoned" | "fulfilled" | "cancelled" | "refunded";
  /** True while this order's quantities are subtracted from catalog stock. */
  stockReserved?: boolean;
  stockShortfall?: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: number;
  paidAt?: number;
};

export const FREE_SHIPPING_AT = 3000;
export const STANDARD_SHIPPING = 199;

export function effectivePrice(product: Product) {
  return product.salePrice ?? product.price;
}

export function shippingFor(subtotal: number) {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_AT ? 0 : STANDARD_SHIPPING;
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartQuantity(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Statuses during which an order's pieces are held out of sellable stock. */
const STOCK_HOLDING_STATUSES: CommerceOrder["status"][] = ["pending_payment", "payment_failed", "paid", "fulfilled"];

export function holdsStock(status: CommerceOrder["status"]) {
  return STOCK_HOLDING_STATUSES.includes(status);
}

/** Statuses a captured payment may still promote to "paid". */
export function awaitingPayment(status: CommerceOrder["status"]) {
  return status === "pending_payment" || status === "payment_failed" || status === "abandoned";
}

/** Field-level checkout validation shared by the form and the order API. */
export function customerErrors(customer: Partial<CheckoutCustomer>) {
  const errors: Partial<Record<keyof CheckoutCustomer, string>> = {};
  if (!customer.name?.trim()) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email?.trim() ?? "")) errors.email = "Enter a valid email address.";
  if (!/^\+?[0-9\s-]{8,15}$/.test(customer.phone?.trim() ?? "")) errors.phone = "Enter a valid phone number.";
  if (!customer.address1?.trim()) errors.address1 = "Enter your street address.";
  if (!customer.city?.trim()) errors.city = "Enter your city.";
  if (!customer.state?.trim()) errors.state = "Enter your state.";
  if (!/^[0-9]{6}$/.test(customer.postalCode ?? "")) errors.postalCode = "Enter a six-digit PIN code.";
  return errors;
}

export function campaignIsLive(campaign: Campaign, today = new Date().toISOString().slice(0, 10)) {
  return campaign.active && (!campaign.startsAt || campaign.startsAt <= today) && (!campaign.endsAt || campaign.endsAt >= today);
}

export function findCampaign(campaigns: Campaign[], code: string, today?: string) {
  const wanted = code.trim().toUpperCase();
  if (!wanted) return null;
  return campaigns.find((campaign) => campaign.code.toUpperCase() === wanted && campaignIsLive(campaign, today)) ?? null;
}

export function orderTotals(items: CartItem[], campaign: Campaign | null) {
  const subtotal = cartSubtotal(items);
  const eligible = campaign ? cartSubtotal(items.filter((item) => campaign.appliesTo.includes(item.category))) : 0;
  const discount = campaign ? Math.round((eligible * campaign.discountPercent) / 100) : 0;
  const shipping = shippingFor(subtotal);
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
