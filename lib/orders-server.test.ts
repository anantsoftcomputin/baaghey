import { beforeEach, describe, expect, it, vi } from "vitest";

type Tree = Record<string, unknown>;
const state: { root: Tree } = { root: {} };
const sent: string[] = [];

function read(path: string) {
  return path.split("/").filter(Boolean).reduce<unknown>((node, key) => (node as Tree | undefined)?.[key], state.root);
}

function write(path: string, value: unknown) {
  const keys = path.split("/").filter(Boolean);
  const last = keys.pop()!;
  let node = state.root;
  for (const key of keys) node = (node[key] ??= {}) as Tree;
  if (value === null || value === undefined) delete node[last];
  else node[last] = value;
}

const clone = <T,>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));
const snapshot = (value: unknown) => ({ exists: () => value !== undefined && value !== null, val: () => clone(value) ?? null });

// Mimics Realtime Database: a transaction first runs against an empty local cache (null),
// then against server data; returning undefined aborts.
const fakeDatabase = {
  ref: (path = "") => ({
    async transaction(update: (current: unknown) => unknown) {
      update(null);
      const next = update(clone(read(path)) ?? null);
      if (next === undefined) return { committed: false, snapshot: snapshot(read(path)) };
      write(path, next);
      return { committed: true, snapshot: snapshot(read(path)) };
    },
    async get() { return snapshot(read(path)); },
    async set(value: unknown) { write(path, value); },
  }),
};

vi.mock("@/lib/firebase-admin", () => ({ adminDatabase: fakeDatabase }));
vi.mock("@/lib/email", () => ({ sendOrderConfirmation: vi.fn(async (order: { id: string }) => { sent.push(order.id); }) }));

const { abandonOrder, adjustProductStock, markOrderPaid, markPaymentFailed, reserveStock, transitionOrder } = await import("./orders-server");

const items = [
  { productId: "kamal", category: "shirts", name: "Kamal", slug: "kamal", size: "M", price: 4800, quantity: 2 },
];

function seed(orderStatus = "pending_payment", stockReserved = true) {
  state.root = {
    catalog: { products: { kamal: { id: "kamal", inventory: 5, sizeInventory: { M: 3, L: 2 } } } },
    orders: { o1: { id: "o1", status: orderStatus, stockReserved, items, total: 9600, createdAt: 1 } },
  };
  sent.length = 0;
}

const stock = () => read("catalog/products/kamal") as { inventory: number; sizeInventory: Record<string, number> };
const order = () => read("orders/o1") as { status: string; stockReserved: boolean; razorpayPaymentId?: string; stockShortfall?: boolean };

describe("stock reservation", () => {
  beforeEach(() => seed());

  it("reserves all lines or none", async () => {
    expect(await reserveStock([{ productId: "kamal", size: "M", quantity: 2 }])).toBe(true);
    expect(stock()).toEqual({ id: "kamal", inventory: 3, sizeInventory: { M: 1, L: 2 } });
    expect(await reserveStock([{ productId: "kamal", size: "L", quantity: 1 }, { productId: "kamal", size: "M", quantity: 2 }])).toBe(false);
    expect(stock().sizeInventory).toEqual({ M: 1, L: 2 });
    expect(stock().inventory).toBe(3);
  });
});

describe("order transitions", () => {
  beforeEach(() => seed());

  it("promotes once, emails once, and keeps stock held", async () => {
    await markOrderPaid("o1", "pay_1");
    await markOrderPaid("o1", "pay_1");
    expect(order().status).toBe("paid");
    expect(sent).toEqual(["o1"]);
    expect(stock().sizeInventory.M).toBe(3);
  });

  it("ignores a late payment event after fulfilment", async () => {
    seed("fulfilled");
    await markOrderPaid("o1", "pay_1");
    expect(order().status).toBe("fulfilled");
    expect(sent).toEqual([]);
  });

  it("does not mark a paid order failed", async () => {
    await markOrderPaid("o1", "pay_1");
    await markPaymentFailed("o1");
    expect(order().status).toBe("paid");
  });

  it("releases stock on abandon and re-holds it if a late payment lands", async () => {
    await abandonOrder("o1");
    expect(order()).toMatchObject({ status: "abandoned", stockReserved: false });
    expect(stock().sizeInventory.M).toBe(5);
    await markOrderPaid("o1", "pay_late");
    expect(order()).toMatchObject({ status: "paid", stockReserved: true, razorpayPaymentId: "pay_late" });
    expect(stock().sizeInventory.M).toBe(3);
  });

  it("flags a shortfall instead of going negative", async () => {
    seed("abandoned", false);
    write("catalog/products/kamal/sizeInventory/M", 1);
    await markOrderPaid("o1", "pay_1");
    expect(stock().sizeInventory.M).toBe(0);
    expect(order().stockShortfall).toBe(true);
  });

  it("restocks on cancel and refund exactly once", async () => {
    await transitionOrder("o1", () => ({ status: "cancelled" }));
    await transitionOrder("o1", () => ({ status: "refunded" }));
    expect(stock().sizeInventory.M).toBe(5);
    expect(stock().inventory).toBe(7);
  });

  it("treats legacy inventoryAdjusted orders as holding stock", async () => {
    state.root.orders = { o1: { id: "o1", status: "paid", inventoryAdjusted: true, items, total: 9600, createdAt: 1 } };
    await transitionOrder("o1", () => ({ status: "refunded" }));
    expect(stock().sizeInventory.M).toBe(5);
  });
});

describe("admin stock adjustment", () => {
  beforeEach(() => seed());

  it("applies relative changes on top of a hold made after the admin loaded the form", async () => {
    // Admin saw M:3 / total 5, then a shopper reserved one M.
    await reserveStock([{ productId: "kamal", size: "M", quantity: 1 }]);
    await adjustProductStock("kamal", [{ size: "M", delta: 4 }]);
    expect(stock().sizeInventory.M).toBe(6);
    expect(stock().inventory).toBe(8);
  });

  it("adds a new size, moves an unsized total, and clamps at zero", async () => {
    await adjustProductStock("kamal", [{ size: "XL", delta: 2 }, { size: "L", delta: -9 }, { delta: -1 }]);
    expect(stock().sizeInventory).toMatchObject({ M: 3, L: 0, XL: 2 });
    expect(stock().inventory).toBe(4);
  });

  it("rejects an unknown product", async () => {
    await expect(adjustProductStock("missing", [{ delta: 1 }])).rejects.toThrow("Product not found.");
  });
});
