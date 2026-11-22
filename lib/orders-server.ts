import { adminDatabase } from "@/lib/firebase-admin";
import { awaitingPayment, holdsStock, type CartItem, type CommerceOrder } from "@/lib/commerce";
import { sendOrderConfirmation } from "@/lib/email";

/** How long an unpaid order may hold stock before the sweep releases it. */
export const RESERVATION_MS = 30 * 60_000;

type StockLine = Pick<CartItem, "productId" | "size" | "quantity">;

export type StoredOrder = CommerceOrder & {
  accessToken?: string;
  /** Legacy flags from before `stockReserved` existed. */
  inventoryAdjusted?: boolean;
  restocked?: boolean;
  refundInProgress?: number | null;
  razorpayRefundId?: string;
  refundedAt?: number;
  updatedAt?: number;
};

function database() {
  if (!adminDatabase) throw new Error("Firebase Admin is not configured.");
  return adminDatabase;
}

function isHoldingStock(order: StoredOrder) {
  return order.stockReserved ?? Boolean(order.inventoryAdjusted && !order.restocked);
}

/** Moves one size of one product by `delta`, inside a transaction scoped to that
 * product only. A strict decrement aborts rather than overselling; a lenient one
 * clamps at zero and reports the shortfall. Products missing from the database
 * (seed-catalog mode) have no tracked stock and always succeed. */
async function adjustStock(line: StockLine, delta: number, strict: boolean) {
  let shortfall = false;
  const result = await database().ref(`catalog/products/${line.productId}`).transaction((product) => {
    if (!product) return product;
    shortfall = false;
    const sized = product.sizeInventory?.[line.size];
    const available = Number(sized ?? product.inventory ?? 0);
    if (delta < 0 && available + delta < 0) {
      if (strict) return;
      shortfall = true;
    }
    product.inventory = Math.max(0, Number(product.inventory ?? 0) + delta);
    if (sized !== undefined) product.sizeInventory[line.size] = Math.max(0, Number(sized) + delta);
    return product;
  });
  return { committed: result.committed, shortfall };
}

export type StockAdjustment = { size?: string; delta: number };

/** Admin stock correction applied as relative changes inside one transaction,
 * so it composes with holds and releases made by orders in the meantime instead
 * of overwriting them. A sized line moves that size and the total; an unsized
 * line moves the total only. Counts clamp at zero, and the total moves only by
 * what a size actually changed. */
export async function adjustProductStock(productId: string, lines: StockAdjustment[]) {
  const result = await database().ref(`catalog/products/${productId}`).transaction((product) => {
    if (!product) return product;
    for (const line of lines) {
      const delta = Math.trunc(Number(line.delta));
      if (!delta) continue;
      let applied = delta;
      if (line.size) {
        product.sizeInventory ??= {};
        const before = Number(product.sizeInventory[line.size] ?? 0);
        product.sizeInventory[line.size] = Math.max(0, before + delta);
        applied = product.sizeInventory[line.size] - before;
      }
      product.inventory = Math.max(0, Number(product.inventory ?? 0) + applied);
    }
    product.updatedAt = Date.now();
    return product;
  });
  if (!result.snapshot?.exists()) throw new Error("Product not found.");
  return result.snapshot.val() as { inventory: number; sizeInventory?: Record<string, number> };
}

/** All-or-nothing hold used when an order is created. */
export async function reserveStock(lines: StockLine[]) {
  const done: StockLine[] = [];
  for (const line of lines) {
    const { committed } = await adjustStock(line, -line.quantity, true);
    if (!committed) {
      await Promise.all(done.map((item) => adjustStock(item, item.quantity, false)));
      return false;
    }
    done.push(line);
  }
  return true;
}

async function applyStock(lines: StockLine[], direction: 1 | -1) {
  let shortfall = false;
  for (const line of lines) {
    const result = await adjustStock(line, direction * line.quantity, false);
    shortfall ||= result.shortfall;
  }
  return shortfall;
}

/** Applies `decide`'s patch to one order atomically, then reconciles catalog stock
 * so it is held exactly while the order's status calls for it. Returning null
 * from `decide` leaves the order untouched. */
export async function transitionOrder(orderId: string, decide: (order: StoredOrder) => Partial<StoredOrder> | null) {
  let stockChange: "hold" | "release" | null = null;
  let previous: StoredOrder | null = null;
  const result = await database().ref(`orders/${orderId}`).transaction((order: StoredOrder | null) => {
    if (!order) return order;
    stockChange = null;
    previous = order;
    const patch = decide(order);
    if (!patch) return;
    const next: StoredOrder = { ...order, ...patch, updatedAt: Date.now() };
    const shouldHold = holdsStock(next.status);
    const holding = isHoldingStock(order);
    if (shouldHold && !holding) stockChange = "hold";
    if (!shouldHold && holding) stockChange = "release";
    next.stockReserved = shouldHold;
    for (const key of Object.keys(next) as (keyof StoredOrder)[]) if (next[key] === undefined) delete next[key];
    return next;
  });
  if (!result.snapshot?.exists()) throw new Error("Order not found.");
  const order = result.snapshot.val() as StoredOrder;
  if (!result.committed) return { order, previous: previous as StoredOrder | null, changed: false };
  const change = stockChange as "hold" | "release" | null;
  if (change) {
    const shortfall = await applyStock(order.items, change === "hold" ? -1 : 1);
    if (shortfall) await database().ref(`orders/${orderId}/stockShortfall`).set(true);
  }
  return { order, previous: previous as StoredOrder | null, changed: true };
}

/** Safe to call from both the browser verification and the webhook, in any
 * order and any number of times: only the first call promotes the order and
 * sends the email, and a late webhook can never undo fulfilment or a refund. */
export async function markOrderPaid(orderId: string, paymentId: string) {
  let promoted = false;
  const { order } = await transitionOrder(orderId, (current) => {
    promoted = false;
    const patch: Partial<StoredOrder> = {};
    if (!current.razorpayPaymentId) patch.razorpayPaymentId = paymentId;
    if (awaitingPayment(current.status)) {
      patch.status = "paid";
      patch.paidAt = current.paidAt ?? Date.now();
      promoted = true;
    }
    return Object.keys(patch).length ? patch : null;
  });
  if (promoted) await sendOrderConfirmation(order).catch((error) => console.error("Order email failed", error));
  return order;
}

export async function markPaymentFailed(orderId: string) {
  return transitionOrder(orderId, (order) => (order.status === "pending_payment" ? { status: "payment_failed" } : null));
}

/** The shopper closed the payment window: free their pieces right away. A late
 * UPI approval can still promote the order through `markOrderPaid`. */
export async function abandonOrder(orderId: string) {
  return transitionOrder(orderId, (order) => (order.status === "pending_payment" || order.status === "payment_failed" ? { status: "abandoned" } : null));
}

export async function releaseStaleReservations(now = Date.now()) {
  const cutoff = now - RESERVATION_MS;
  let released = 0;
  for (const status of ["pending_payment", "payment_failed"] as const) {
    const snapshot = await database().ref("orders").orderByChild("status").equalTo(status).limitToFirst(50).get();
    const stale = Object.entries((snapshot.val() ?? {}) as Record<string, StoredOrder>).filter(([, order]) => order.createdAt < cutoff);
    for (const [id] of stale) if ((await abandonOrder(id)).changed) released += 1;
  }
  return released;
}

export async function orderIdForPayment(razorpayOrderId: string) {
  const snapshot = await database().ref("orders").orderByChild("razorpayOrderId").equalTo(razorpayOrderId).limitToFirst(1).get();
  const value = snapshot.val() as Record<string, unknown> | null;
  return value ? Object.keys(value)[0] : null;
}
