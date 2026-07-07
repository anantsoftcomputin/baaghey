"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeIndianRupee,
  Boxes,
  Edit3,
  ImagePlus,
  PackagePlus,
  Percent,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  auth,
  deleteCampaign,
  deleteCategory,
  deleteProduct,
  firebaseReady,
  loginWithEmail,
  loginWithGoogle,
  patchProduct,
  subscribeCampaigns,
  subscribeCategories,
  subscribeProducts,
  upsertCampaign,
  upsertCategory,
  upsertProduct,
} from "@/lib/firebase";
import {
  campaigns as seedCampaigns,
  categories as seedCategories,
  products as seedProducts,
  type Campaign,
  type Category,
  type Product,
  type ProductStatus,
} from "@/lib/products";

const emptyProduct: Product = {
  id: "",
  name: "",
  category: "shirts",
  material: "",
  price: 0,
  salePrice: undefined,
  color: "",
  craft: "",
  sku: "",
  status: "draft",
  featured: false,
  inventory: 0,
  lowStockAt: 3,
  sizes: ["S", "M", "L"],
  tags: [],
  image:
    "radial-gradient(circle at 20% 18%, #fff7e6 0 2px, transparent 3px), radial-gradient(circle at 78% 60%, #fff7e6 0 2px, transparent 3px), linear-gradient(135deg, #203a63, #486a31)",
  description: "",
  details: "",
  care: "",
};

const emptyCategory: Category = {
  id: "",
  name: "",
  description: "",
  sortOrder: 9,
  featured: true,
};

const emptyCampaign: Campaign = {
  id: "",
  name: "",
  code: "",
  discountPercent: 10,
  startsAt: "",
  endsAt: "",
  active: false,
  appliesTo: ["shirts"],
};

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [categoryForm, setCategoryForm] = useState<Category>(emptyCategory);
  const [campaignForm, setCampaignForm] = useState<Campaign>(emptyCampaign);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<"products" | "inventory" | "categories" | "campaigns">("products");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthChecked(true);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      setAdminUser(user?.email ?? user?.phoneNumber ?? user?.uid ?? null);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribeProducts = subscribeProducts((items) => {
      if (items.length) setProducts(items);
    });
    const unsubscribeCategories = subscribeCategories((items) => {
      if (items.length) setCategories(items);
    });
    const unsubscribeCampaigns = subscribeCampaigns((items) => {
      if (items.length) setCampaigns(items);
    });
    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeCampaigns();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !needle ||
        [product.name, product.sku, product.material, product.color, product.category, product.craft]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [products, query, statusFilter]);

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.status === "active");
    const lowStock = products.filter((product) => product.inventory <= product.lowStockAt);
    const inventoryValue = products.reduce((sum, product) => sum + product.inventory * product.price, 0);
    return {
      active: activeProducts.length,
      lowStock: lowStock.length,
      inventoryValue,
      campaigns: campaigns.filter((campaign) => campaign.active).length,
    };
  }, [campaigns, products]);

  function productChange<K extends keyof Product>(key: K, value: Product[K]) {
    setProductForm((current) => ({ ...current, [key]: value }));
  }

  async function saveProduct() {
    try {
      const id = productForm.id || slugify(productForm.name);
      if (!id || !productForm.name) {
        setNotice("Add a product name before saving.");
        return;
      }
      await upsertProduct({
        ...productForm,
        id,
        sku: productForm.sku || `BAG-${id.toUpperCase().slice(0, 14)}`,
        tags: cleanList(productForm.tags),
        sizes: cleanList(productForm.sizes),
        price: Number(productForm.price),
        ...(productForm.salePrice ? { salePrice: Number(productForm.salePrice) } : {}),
        ...(productForm.description ? { description: productForm.description } : {}),
        ...(productForm.details ? { details: productForm.details } : {}),
        ...(productForm.care ? { care: productForm.care } : {}),
        ...(productForm.imageDataUrl ? { imageDataUrl: productForm.imageDataUrl } : {}),
        inventory: Number(productForm.inventory),
        lowStockAt: Number(productForm.lowStockAt),
      });
      setProductForm(emptyProduct);
      setNotice("Product saved to Firebase.");
    } catch (error) {
      setNotice(error instanceof Error ? `Product save failed: ${error.message}` : "Product save failed.");
    }
  }

  async function saveCategory() {
    try {
      const id = categoryForm.id || slugify(categoryForm.name);
      if (!id || !categoryForm.name) {
        setNotice("Add a category name before saving.");
        return;
      }
      await upsertCategory({ ...categoryForm, id, sortOrder: Number(categoryForm.sortOrder) });
      setCategoryForm(emptyCategory);
      setNotice("Category saved.");
    } catch (error) {
      setNotice(error instanceof Error ? `Category save failed: ${error.message}` : "Category save failed.");
    }
  }

  async function saveCampaign() {
    try {
      const id = campaignForm.id || slugify(campaignForm.name || campaignForm.code);
      if (!id || !campaignForm.name || !campaignForm.code) {
        setNotice("Add a campaign name and code before saving.");
        return;
      }
      await upsertCampaign({
        ...campaignForm,
        id,
        code: campaignForm.code.toUpperCase(),
        discountPercent: Number(campaignForm.discountPercent),
        appliesTo: cleanList(campaignForm.appliesTo),
      });
      setCampaignForm(emptyCampaign);
      setNotice("Campaign saved.");
    } catch (error) {
      setNotice(error instanceof Error ? `Campaign save failed: ${error.message}` : "Campaign save failed.");
    }
  }

  async function seedCatalog() {
    try {
      await Promise.all([
        ...seedCategories.map((category) => upsertCategory(category)),
        ...seedProducts.map((product) => upsertProduct(product)),
        ...seedCampaigns.map((campaign) => upsertCampaign(campaign)),
      ]);
      setNotice("Seed catalog pushed to Firebase.");
    } catch (error) {
      setNotice(error instanceof Error ? `Seed failed: ${error.message}` : "Seed failed.");
    }
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    productChange("imageDataUrl", dataUrl);
  }

  async function adminLogin() {
    setNotice("");
    try {
      await loginWithEmail(adminEmail, adminPassword);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Admin login failed.");
    }
  }

  async function adminGoogleLogin() {
    setNotice("");
    try {
      await loginWithGoogle();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Google login failed.");
    }
  }

  if (!authChecked) {
    return <main className="grid min-h-screen place-items-center bg-ivory text-mehendi">Loading admin...</main>;
  }

  if (!adminUser) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6efe0] px-4 text-mehendi">
        <section className="w-full max-w-md border border-mehendi/10 bg-white p-6 shadow-textile">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-mehendi/70">
            <ArrowLeft size={16} /> Back to storefront
          </Link>
          <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={86} height={86} className="mb-5 size-20 rounded-full" />
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-sindoor">BAAGAY admin</p>
          <h1 className="mt-2 font-display text-5xl font-bold tracking-normal">Sign in to manage commerce.</h1>
          <div className="mt-6 grid gap-3">
            <input className="admin-input" placeholder="Admin email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} />
            <input
              className="admin-input"
              placeholder="Password"
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
            />
            <button className="admin-button w-full" onClick={adminLogin} disabled={!firebaseReady}>
              Sign in
            </button>
            <button className="admin-button secondary w-full" onClick={adminGoogleLogin} disabled={!firebaseReady}>
              Continue with Google
            </button>
            {notice && <p className="border border-sindoor/20 bg-ivory p-3 text-sm text-sindoor">{notice}</p>}
            <p className="text-xs leading-5 text-mehendi/55">
              For production, add Firebase security rules or custom claims so only approved admin accounts can write catalog data.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6efe0] text-mehendi">
      <header className="sticky top-0 z-30 border-b border-mehendi/10 bg-ivory/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="grid size-10 place-items-center rounded-full border border-mehendi/15 bg-white">
              <ArrowLeft size={18} />
            </Link>
            <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={58} height={58} className="size-14 rounded-full" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-sindoor">BAAGAY admin</p>
              <h1 className="font-display text-4xl font-bold tracking-normal">Commerce command center</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-11 items-center bg-white px-3 text-xs font-bold text-mehendi/60">
              {adminUser}
            </span>
            <button className="admin-button secondary" onClick={seedCatalog} disabled={!firebaseReady}>
              <Sparkles size={16} /> Seed Firebase
            </button>
            <button className="admin-button secondary" onClick={() => auth && signOut(auth)}>
              Sign out
            </button>
            <button className="admin-button" onClick={saveProduct} disabled={!firebaseReady}>
              <Save size={16} /> Save product
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!firebaseReady && (
          <div className="mb-6 border border-sindoor/20 bg-white p-4 text-sm font-semibold text-sindoor">
            Firebase env vars are missing, so admin changes cannot persist yet.
          </div>
        )}
        {notice && <div className="mb-6 border border-neem/20 bg-white p-4 text-sm font-semibold text-neem">{notice}</div>}

        <section className="grid gap-4 md:grid-cols-4">
          <Stat icon={<PackagePlus size={18} />} label="Active products" value={stats.active.toString()} />
          <Stat icon={<Boxes size={18} />} label="Low stock alerts" value={stats.lowStock.toString()} />
          <Stat icon={<BadgeIndianRupee size={18} />} label="Inventory value" value={`₹${stats.inventoryValue.toLocaleString("en-IN")}`} />
          <Stat icon={<Percent size={18} />} label="Live campaigns" value={stats.campaigns.toString()} />
        </section>

        <nav className="mt-8 grid gap-2 border border-mehendi/10 bg-white p-2 text-sm font-extrabold uppercase tracking-[0.14em] sm:grid-cols-4">
          {(["products", "inventory", "categories", "campaigns"] as const).map((tab) => (
            <button
              key={tab}
              className={`h-11 ${activeTab === tab ? "bg-mehendi text-ivory" : "bg-ivory text-mehendi"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === "products" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
            <ProductForm
              form={productForm}
              categories={categories}
              onChange={productChange}
              onImage={handleImage}
              onSave={saveProduct}
            />
            <ProductTable
              products={filteredProducts}
              categories={categories}
              query={query}
              statusFilter={statusFilter}
              onQuery={setQuery}
              onStatus={setStatusFilter}
              onEdit={setProductForm}
              onDelete={async (id) => {
                try {
                  await deleteProduct(id);
                  setNotice("Product deleted.");
                } catch (error) {
                  setNotice(error instanceof Error ? `Product delete failed: ${error.message}` : "Product delete failed.");
                }
              }}
            />
          </section>
        )}

        {activeTab === "inventory" && (
          <section className="mt-6 border border-mehendi/10 bg-white p-5">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-brass">Inventory</p>
                <h2 className="font-display text-4xl font-bold">Stock control</h2>
              </div>
              <span className="text-sm text-mehendi/60">Realtime stock updates</span>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Low at</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td className={product.inventory <= product.lowStockAt ? "text-sindoor" : ""}>{product.inventory}</td>
                      <td>{product.lowStockAt}</td>
                      <td>{product.inventory <= product.lowStockAt ? "Low stock" : "Healthy"}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="mini-button" onClick={() => patchProduct(product.id, { inventory: Math.max(0, product.inventory - 1) })}>
                            -1
                          </button>
                          <button className="mini-button" onClick={() => patchProduct(product.id, { inventory: product.inventory + 1 })}>
                            +1
                          </button>
                          <button className="mini-button" onClick={() => patchProduct(product.id, { status: product.status === "active" ? "draft" : "active" })}>
                            Toggle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "categories" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Panel title="Category builder" kicker="Homepage sections">
              <Field label="Name">
                <input className="admin-input" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
              </Field>
              <Field label="Description">
                <textarea className="admin-input min-h-24" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} />
              </Field>
              <Field label="Sort order">
                <input className="admin-input" type="number" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: Number(event.target.value) })} />
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={categoryForm.featured} onChange={(event) => setCategoryForm({ ...categoryForm, featured: event.target.checked })} />
                Show on homepage
              </label>
              <button className="admin-button w-full" onClick={saveCategory} disabled={!firebaseReady}>
                <Save size={16} /> Save category
              </button>
            </Panel>
            <ListPanel
              title="Categories"
              items={categories.map((category) => ({
                id: category.id,
                title: category.name,
                meta: `${category.sortOrder} · ${category.featured ? "Homepage" : "Hidden"}`,
                onEdit: () => setCategoryForm(category),
                onDelete: async () => {
                  try {
                    await deleteCategory(category.id);
                    setNotice("Category deleted.");
                  } catch (error) {
                    setNotice(error instanceof Error ? `Category delete failed: ${error.message}` : "Category delete failed.");
                  }
                },
              }))}
            />
          </section>
        )}

        {activeTab === "campaigns" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Panel title="Festive sale" kicker="Campaign manager">
              <Field label="Campaign name">
                <input className="admin-input" value={campaignForm.name} onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Code">
                  <input className="admin-input" value={campaignForm.code} onChange={(event) => setCampaignForm({ ...campaignForm, code: event.target.value })} />
                </Field>
                <Field label="Discount %">
                  <input className="admin-input" type="number" value={campaignForm.discountPercent} onChange={(event) => setCampaignForm({ ...campaignForm, discountPercent: Number(event.target.value) })} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Starts">
                  <input className="admin-input" type="date" value={campaignForm.startsAt} onChange={(event) => setCampaignForm({ ...campaignForm, startsAt: event.target.value })} />
                </Field>
                <Field label="Ends">
                  <input className="admin-input" type="date" value={campaignForm.endsAt} onChange={(event) => setCampaignForm({ ...campaignForm, endsAt: event.target.value })} />
                </Field>
              </div>
              <Field label="Applies to categories">
                <input className="admin-input" value={campaignForm.appliesTo.join(", ")} onChange={(event) => setCampaignForm({ ...campaignForm, appliesTo: event.target.value.split(",") })} />
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={campaignForm.active} onChange={(event) => setCampaignForm({ ...campaignForm, active: event.target.checked })} />
                Campaign is live
              </label>
              <button className="admin-button w-full" onClick={saveCampaign} disabled={!firebaseReady}>
                <Save size={16} /> Save campaign
              </button>
            </Panel>
            <ListPanel
              title="Campaigns"
              items={campaigns.map((campaign) => ({
                id: campaign.id,
                title: campaign.name,
                meta: `${campaign.code} · ${campaign.discountPercent}% · ${campaign.active ? "Live" : "Paused"}`,
                onEdit: () => setCampaignForm(campaign),
                onDelete: async () => {
                  try {
                    await deleteCampaign(campaign.id);
                    setNotice("Campaign deleted.");
                  } catch (error) {
                    setNotice(error instanceof Error ? `Campaign delete failed: ${error.message}` : "Campaign delete failed.");
                  }
                },
              }))}
            />
          </section>
        )}
      </div>
    </main>
  );
}

function ProductForm({
  form,
  categories,
  onChange,
  onImage,
  onSave,
}: {
  form: Product;
  categories: Category[];
  onChange: <K extends keyof Product>(key: K, value: Product[K]) => void;
  onImage: (file: File | undefined) => void;
  onSave: () => void;
}) {
  return (
    <Panel title="Product studio" kicker="Create and edit">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Product name">
          <input className="admin-input" value={form.name} onChange={(event) => onChange("name", event.target.value)} />
        </Field>
        <Field label="SKU">
          <input className="admin-input" value={form.sku} onChange={(event) => onChange("sku", event.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select className="admin-input" value={form.category} onChange={(event) => onChange("category", event.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className="admin-input" value={form.status} onChange={(event) => onChange("status", event.target.value as ProductStatus)}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Price">
          <input className="admin-input" type="number" value={form.price} onChange={(event) => onChange("price", Number(event.target.value))} />
        </Field>
        <Field label="Sale price">
          <input className="admin-input" type="number" value={form.salePrice ?? ""} onChange={(event) => onChange("salePrice", event.target.value ? Number(event.target.value) : undefined)} />
        </Field>
        <Field label="Inventory">
          <input className="admin-input" type="number" value={form.inventory} onChange={(event) => onChange("inventory", Number(event.target.value))} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Material">
          <input className="admin-input" value={form.material} onChange={(event) => onChange("material", event.target.value)} />
        </Field>
        <Field label="Color">
          <input className="admin-input" value={form.color} onChange={(event) => onChange("color", event.target.value)} />
        </Field>
      </div>
      <Field label="Craft / description">
        <textarea className="admin-input min-h-24" value={form.craft} onChange={(event) => onChange("craft", event.target.value)} />
      </Field>
      <Field label="Long product description">
        <textarea className="admin-input min-h-28" value={form.description ?? ""} onChange={(event) => onChange("description", event.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Product details">
          <textarea className="admin-input min-h-28" value={form.details ?? ""} onChange={(event) => onChange("details", event.target.value)} />
        </Field>
        <Field label="Fabric care">
          <textarea className="admin-input min-h-28" value={form.care ?? ""} onChange={(event) => onChange("care", event.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Low stock alert">
          <input className="admin-input" type="number" value={form.lowStockAt} onChange={(event) => onChange("lowStockAt", Number(event.target.value))} />
        </Field>
        <Field label="Sizes">
          <input className="admin-input" value={form.sizes.join(", ")} onChange={(event) => onChange("sizes", event.target.value.split(","))} />
        </Field>
        <Field label="Tags">
          <input className="admin-input" value={form.tags.join(", ")} onChange={(event) => onChange("tags", event.target.value.split(","))} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={form.featured} onChange={(event) => onChange("featured", event.target.checked)} />
        Featured on homepage
      </label>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-mehendi/25 bg-ivory p-4 text-center text-sm font-semibold">
        <ImagePlus size={20} />
        Upload product image to Realtime Database as data URL
        <input className="hidden" type="file" accept="image/*" onChange={(event) => onImage(event.target.files?.[0])} />
      </label>
      {form.imageDataUrl && <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${form.imageDataUrl})` }} />}
      <button className="admin-button w-full" onClick={onSave} disabled={!firebaseReady}>
        <Save size={16} /> Save product
      </button>
    </Panel>
  );
}

function ProductTable({
  products,
  categories,
  query,
  statusFilter,
  onQuery,
  onStatus,
  onEdit,
  onDelete,
}: {
  products: Product[];
  categories: Category[];
  query: string;
  statusFilter: ProductStatus | "all";
  onQuery: (value: string) => void;
  onStatus: (value: ProductStatus | "all") => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}) {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  return (
    <section className="border border-mehendi/10 bg-white p-5">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-brass">Catalog</p>
          <h2 className="font-display text-4xl font-bold">Products</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
          <label className="flex h-11 items-center gap-2 border border-mehendi/15 bg-ivory px-3">
            <Search size={16} />
            <input className="w-full bg-transparent text-sm outline-none" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search products" />
          </label>
          <select className="admin-input h-11" value={statusFilter} onChange={(event) => onStatus(event.target.value as ProductStatus | "all")}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="font-bold">{product.name}</div>
                  <div className="text-xs text-mehendi/55">{product.sku}</div>
                </td>
                <td>{categoryMap.get(product.category) ?? product.category}</td>
                <td>
                  ₹{product.price.toLocaleString("en-IN")}
                  {product.salePrice ? <span className="ml-2 text-sindoor">₹{product.salePrice.toLocaleString("en-IN")}</span> : null}
                </td>
                <td className={product.inventory <= product.lowStockAt ? "font-bold text-sindoor" : ""}>{product.inventory}</td>
                <td>{product.status}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="icon-button" onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`}>
                      <Edit3 size={15} />
                    </button>
                    <button className="icon-button danger" onClick={() => onDelete(product.id)} aria-label={`Delete ${product.name}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="border border-mehendi/10 bg-white p-5">
      <div className="mb-5 grid size-10 place-items-center rounded-full bg-kesar/25 text-sindoor">{icon}</div>
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-mehendi/50">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border border-mehendi/10 bg-white p-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-brass">{kicker}</p>
        <h2 className="font-display text-4xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-mehendi/75">
      {label}
      {children}
    </label>
  );
}

function ListPanel({
  title,
  items,
}: {
  title: string;
  items: { id: string; title: string; meta: string; onEdit: () => void; onDelete: () => void }[];
}) {
  return (
    <section className="border border-mehendi/10 bg-white p-5">
      <h2 className="font-display text-4xl font-bold">{title}</h2>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 border border-mehendi/10 bg-ivory p-4">
            <div>
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-mehendi/55">{item.meta}</p>
            </div>
            <div className="flex gap-2">
              <button className="icon-button" onClick={item.onEdit}>
                <Edit3 size={15} />
              </button>
              <button className="icon-button danger" onClick={item.onDelete}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cleanList(value: string[]) {
  return value.map((item) => item.trim()).filter(Boolean);
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
