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
  PackagePlus,
  Percent,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  adjustStock,
  auth,
  deleteCampaign,
  deleteCategory,
  deleteProduct,
  firebaseReady,
  ensureUserProfile,
  getProduct,
  isAdminUser,
  loginWithEmail,
  loginWithGoogle,
  patchProduct,
  saveProductDetails,
  seedMissingCatalog,
  subscribeCampaigns,
  subscribeCategories,
  subscribeProducts,
  subscribeOrders,
  upsertCampaign,
  upsertCategory,
  upsertProduct,
  uploadCategoryMedia,
  type StockLine,
} from "@/lib/firebase";
import {
  campaigns as seedCampaigns,
  categories as seedCategories,
  products as seedProducts,
  type Campaign,
  type Category,
  type Product,
  type ProductStatus,
  type Subcategory,
} from "@/lib/products";
import type { CommerceOrder } from "@/lib/commerce";

const emptyProduct: Product = {
  id: "",
  name: "",
  category: "shirts",
  subcategory: undefined,
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
    "radial-gradient(circle at 20% 18%, #f4f4f4 0 2px, transparent 3px), radial-gradient(circle at 78% 60%, #f4f4f4 0 2px, transparent 3px), linear-gradient(135deg, #222, #555)",
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
  subcategories: [],
  videoUrl: "",
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
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  /** Stock as it was when the product was opened for editing; saving sends
   * only the difference, so holds placed by checkouts meanwhile survive. */
  const [stockBaseline, setStockBaseline] = useState<StockSnapshot | null>(null);
  const [categoryForm, setCategoryForm] = useState<Category>(emptyCategory);
  const [campaignForm, setCampaignForm] = useState<Campaign>(emptyCampaign);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<"products" | "inventory" | "categories" | "campaigns" | "orders">("products");
  const [notice, setNotice] = useState("");
  const [migrating, setMigrating] = useState(false);
  const embeddedPhotoCount =
    products.filter((product) => [product.photo, ...(product.images ?? [])].some((src) => src?.startsWith("data:"))).length +
    categories.filter((category) => [category.videoUrl, category.coverPhoto].some((src) => src?.startsWith("data:"))).length;
  const [categoryUpload, setCategoryUpload] = useState<"" | "videoUrl" | "coverPhoto">("");

  useEffect(() => {
    if (!auth) {
      setAuthChecked(true);
      return;
    }
    const activeAuth = auth;
    return onAuthStateChanged(activeAuth, async (user) => {
      if (!user) {
        setAdminUser(null);
        setAuthChecked(true);
        return;
      }
      await ensureUserProfile(user);
      if (await isAdminUser(user)) setAdminUser(user.email ?? user.phoneNumber ?? user.uid);
      else {
        setAdminUser(null);
        setNotice("This account does not have BAAGAY admin permission.");
        await signOut(activeAuth);
      }
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribeProducts = subscribeProducts(setProducts);
    const unsubscribeCategories = subscribeCategories(setCategories);
    const unsubscribeCampaigns = subscribeCampaigns(setCampaigns);
    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeCampaigns();
    };
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    return subscribeOrders(setOrders);
  }, [adminUser]);

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
      const record: Product = {
        ...productForm,
        id,
        sku: productForm.sku || `BAG-${id.toUpperCase().slice(0, 14)}`,
        tags: cleanList(productForm.tags),
        sizes: cleanList(productForm.sizes),
        price: Number(productForm.price),
        ...(productForm.salePrice ? { salePrice: Number(productForm.salePrice) } : {}),
        ...(productForm.subcategory ? { subcategory: productForm.subcategory } : {}),
        ...(productForm.description ? { description: productForm.description } : {}),
        ...(productForm.details ? { details: productForm.details } : {}),
        ...(productForm.care ? { care: productForm.care } : {}),
        inventory: stockTotal(productForm),
        lowStockAt: Number(productForm.lowStockAt),
      };
      const stored = await getProduct(id);
      if (!stored) {
        await upsertProduct(record);
      } else {
        await saveProductDetails(record);
        // Without a baseline (a new form whose name matches an existing product),
        // diff against the stock stored right now.
        const lines = stockDeltas(stockBaseline ?? stored, record);
        if (lines.length) await adjustStock(id, lines);
      }
      setProductForm(emptyProduct);
      setStockBaseline(null);
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
      if ([categoryForm.videoUrl, categoryForm.coverPhoto].some((src) => src?.startsWith("data:"))) {
        setNotice("Embedded media can't be saved in the database. Upload the file instead, or run “Move media to Storage” first.");
        return;
      }
      await upsertCategory({
        ...categoryForm,
        id,
        sortOrder: Number(categoryForm.sortOrder),
        subcategories: (categoryForm.subcategories ?? [])
          .map((sub, index) => ({ ...sub, id: sub.id || slugify(sub.name), sortOrder: index + 1 }))
          .filter((sub) => sub.name),
        ...(categoryForm.videoUrl ? { videoUrl: categoryForm.videoUrl } : {}),
      });
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
      const created = await seedMissingCatalog({ products: seedProducts, categories: seedCategories, campaigns: seedCampaigns });
      setNotice(created ? `Added ${created} missing seed record${created === 1 ? "" : "s"}. Existing products were left untouched.` : "Every seed record already exists; nothing was changed.");
    } catch (error) {
      setNotice(error instanceof Error ? `Seed failed: ${error.message}` : "Seed failed.");
    }
  }

  async function migrateImages() {
    setMigrating(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const response = await fetch("/api/admin/migrate-images", { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {} });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Migration failed.");
      setNotice(`Moved ${data.moved} photo${data.moved === 1 ? "" : "s"} to Cloud Storage.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Migration failed.");
    } finally {
      setMigrating(false);
    }
  }

  async function changeOrderStatus(order: CommerceOrder, status: CommerceOrder["status"]) {
    try {
      if (status === "refunded") {
        const token = await auth?.currentUser?.getIdToken();
        const response = await fetch(`/api/admin/orders/${order.id}/refund`, { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {} });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Refund failed.");
        setNotice("Refund submitted to Razorpay.");
      } else {
        const token = await auth?.currentUser?.getIdToken();
        const response = await fetch(`/api/admin/orders/${order.id}/status`, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ status }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Order update failed.");
        setNotice(status === "cancelled" ? "Order cancelled and its pieces returned to stock." : "Order status updated.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Order update failed.");
    }
  }

  function editProduct(product: Product) {
    setProductForm(product);
    setStockBaseline({ inventory: product.inventory, sizeInventory: product.sizeInventory });
  }

  async function bumpStock(product: Product, delta: number, size?: string) {
    try {
      await adjustStock(product.id, [{ ...(size ? { size } : {}), delta }]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Stock update failed.");
    }
  }

  function addSubcategoryRow() {
    setCategoryForm((current) => ({
      ...current,
      subcategories: [...(current.subcategories ?? []), { id: "", name: "", sortOrder: (current.subcategories?.length ?? 0) + 1 }],
    }));
  }

  function updateSubcategoryRow(index: number, name: string) {
    setCategoryForm((current) => {
      const subcategories = [...(current.subcategories ?? [])];
      subcategories[index] = { ...subcategories[index], name, id: slugify(name) };
      return { ...current, subcategories };
    });
  }

  function removeSubcategoryRow(index: number) {
    setCategoryForm((current) => ({
      ...current,
      subcategories: (current.subcategories ?? []).filter((_, i) => i !== index),
    }));
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
    return <main className="grid min-h-screen place-items-center bg-white text-black">Loading admin...</main>;
  }

  if (!adminUser) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4 text-black">
        <section className="w-full max-w-md border border-line bg-white p-6">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-mute">
            <ArrowLeft size={16} /> Back to storefront
          </Link>
          <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={72} height={72} className="mb-5 size-14 rounded-full" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">BAAGAY admin</p>
          <h1 className="mt-2 text-4xl font-bold">Sign in to manage commerce.</h1>
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
            {notice && <p className="border border-line bg-white p-3 text-sm text-accent">{notice}</p>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="grid size-10 place-items-center border border-line bg-white">
              <ArrowLeft size={18} />
            </Link>
            <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={48} height={48} className="size-11 rounded-full" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">BAAGAY admin</p>
              <h1 className="text-2xl font-bold">Commerce command center</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-11 items-center border border-line px-3 text-xs font-semibold text-mute">
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
          <div className="mb-6 border border-line bg-white p-4 text-sm font-semibold text-accent">
            Firebase env vars are missing, so admin changes cannot persist yet.
          </div>
        )}
        {notice && <div className="mb-6 border border-line bg-white p-4 text-sm font-semibold">{notice}</div>}
        {embeddedPhotoCount > 0 && (
          <div className="mb-6 flex flex-col justify-between gap-3 border border-yellow-dark/30 bg-yellow-light p-4 text-sm sm:flex-row sm:items-center">
            <p><strong>{embeddedPhotoCount} product{embeddedPhotoCount === 1 ? "" : "s"} or categor{embeddedPhotoCount === 1 ? "y" : "ies"}</strong> still store photos or videos inside the database, which every shopper then downloads on every page. Move them to Cloud Storage once.</p>
            <button className="admin-button shrink-0" disabled={migrating} onClick={migrateImages}>{migrating ? "Moving…" : "Move media to Storage"}</button>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <Stat icon={<PackagePlus size={18} />} label="Active products" value={stats.active.toString()} />
          <Stat icon={<Boxes size={18} />} label="Low stock alerts" value={stats.lowStock.toString()} />
          <Stat icon={<BadgeIndianRupee size={18} />} label="Inventory value" value={`₹${stats.inventoryValue.toLocaleString("en-IN")}`} />
          <Stat icon={<Percent size={18} />} label="Live campaigns" value={stats.campaigns.toString()} />
        </section>

        <nav className="mt-8 grid gap-2 border border-line bg-white p-2 text-sm font-bold uppercase tracking-[0.08em] sm:grid-cols-5">
          {(["products", "inventory", "categories", "campaigns", "orders"] as const).map((tab) => (
            <button
              key={tab}
              className={`h-11 ${activeTab === tab ? "bg-green text-white" : "bg-white text-black"}`}
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
              onSave={saveProduct}
            />
            <ProductTable
              products={filteredProducts}
              categories={categories}
              query={query}
              statusFilter={statusFilter}
              onQuery={setQuery}
              onStatus={setStatusFilter}
              onEdit={editProduct}
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
          <section className="mt-6 border border-line bg-white p-5">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">Inventory</p>
                <h2 className="text-3xl font-bold">Stock control</h2>
              </div>
              <span className="text-sm text-mute">Realtime stock updates</span>
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
                      <td className={product.inventory <= product.lowStockAt ? "font-bold text-accent" : ""}>{product.inventory}</td>
                      <td>{product.lowStockAt}</td>
                      <td>{product.inventory <= product.lowStockAt ? "Low stock" : "Healthy"}</td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          {hasSizedStock(product) ? (
                            Object.entries(product.sizeInventory ?? {}).map(([size, count]) => (
                              <span key={size} className="inline-flex items-center gap-1 text-xs">
                                <span className="font-semibold">{size}:{count}</span>
                                <button className="mini-button" aria-label={`Remove one ${size}`} disabled={count <= 0} onClick={() => bumpStock(product, -1, size)}>-1</button>
                                <button className="mini-button" aria-label={`Add one ${size}`} onClick={() => bumpStock(product, 1, size)}>+1</button>
                              </span>
                            ))
                          ) : (
                            <>
                              <button className="mini-button" disabled={product.inventory <= 0} onClick={() => bumpStock(product, -1)}>
                                -1
                              </button>
                              <button className="mini-button" onClick={() => bumpStock(product, 1)}>
                                +1
                              </button>
                            </>
                          )}
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
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
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

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-mute">Subcategories</p>
                  <button className="icon-button" onClick={addSubcategoryRow} aria-label="Add subcategory" type="button">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="grid gap-2">
                  {(categoryForm.subcategories ?? []).map((sub, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        className="admin-input"
                        placeholder="Subcategory name"
                        value={sub.name}
                        onChange={(event) => updateSubcategoryRow(index, event.target.value)}
                      />
                      <button className="icon-button danger" onClick={() => removeSubcategoryRow(index)} aria-label="Remove subcategory" type="button">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(categoryForm.subcategories ?? []).length === 0 && (
                    <p className="text-xs text-faint">No subcategories yet — add one to let shoppers drill down (e.g. Full Sleeve, Half Sleeve).</p>
                  )}
                </div>
              </div>

              {(["videoUrl", "coverPhoto"] as const).map((key) => (
                <Field key={key} label={key === "videoUrl" ? "Category video (autoplays on the category tile instead of a photo)" : "Category cover photo (video poster and fallback)"}>
                  <div className="flex gap-2">
                    <input className="admin-input min-w-0 flex-1" placeholder={key === "videoUrl" ? "Upload, or paste /my-video.mp4 or https://…" : "Upload, or paste https://…"} value={categoryForm[key]?.startsWith("data:") ? "(embedded in database — move to Storage)" : categoryForm[key] ?? ""} onChange={(event) => setCategoryForm({ ...categoryForm, [key]: event.target.value })} />
                    <label className={`admin-button secondary shrink-0 cursor-pointer ${categoryUpload ? "pointer-events-none opacity-60" : ""}`}>
                      {categoryUpload === key ? "Uploading…" : "Upload"}
                      <input type="file" className="sr-only" accept={key === "videoUrl" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp"} onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        setCategoryUpload(key);
                        try {
                          const url = await uploadCategoryMedia(categoryForm.id || slugify(categoryForm.name), file);
                          setCategoryForm((current) => ({ ...current, [key]: url }));
                          setNotice("Uploaded. Save the category to publish it.");
                        } catch (error) {
                          setNotice(error instanceof Error ? error.message : "Upload failed.");
                        } finally {
                          setCategoryUpload("");
                        }
                      }} />
                    </label>
                  </div>
                </Field>
              ))}
              {categoryForm.videoUrl && (
                <video className="h-40 w-full border border-line object-cover" src={categoryForm.videoUrl} muted loop autoPlay playsInline />
              )}

              <button className="admin-button w-full" onClick={saveCategory} disabled={!firebaseReady}>
                <Save size={16} /> Save category
              </button>
            </Panel>
            <ListPanel
              title="Categories"
              items={categories.map((category) => ({
                id: category.id,
                title: category.name,
                meta: `${category.sortOrder} · ${category.featured ? "Homepage" : "Hidden"} · ${category.subcategories?.length ?? 0} subcategories${category.videoUrl ? " · has video" : ""}`,
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

        {activeTab === "orders" && (
          <section className="mt-6 border border-line bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">Fulfilment</p>
            <h2 className="text-3xl font-bold">Orders</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
                {orders.map((order) => <tr key={order.id}><td><strong>{order.id.slice(-8).toUpperCase()}</strong><br /><span className="text-xs text-mute">{new Date(order.createdAt).toLocaleString("en-IN")}</span></td><td>{order.customer.name}<br /><span className="text-xs text-mute">{order.customer.email}</span></td><td>₹{order.total.toLocaleString("en-IN")}</td><td>{order.razorpayPaymentId ?? "Pending"}</td><td><select className="admin-input min-w-36" value={order.status} onChange={(event) => changeOrderStatus(order, event.target.value as CommerceOrder["status"])}><option value="pending_payment">Pending payment</option><option value="payment_failed" disabled>Payment failed</option><option value="abandoned" disabled>Abandoned</option><option value="paid">Paid</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option></select></td></tr>)}
              </tbody></table>
              {!orders.length && <p className="p-6 text-sm text-mute">No orders yet.</p>}
            </div>
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
  onSave,
}: {
  form: Product;
  categories: Category[];
  onChange: <K extends keyof Product>(key: K, value: Product[K]) => void;
  onSave: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");
  const activeCategory = categories.find((category) => category.id === form.category);
  const subcategories: Subcategory[] = activeCategory?.subcategories ?? [];
  const photos = form.images?.length ? form.images : form.photo ? [form.photo] : [];

  async function addProductImages(files: FileList | null) {
    if (!files?.length) return;
    const available = 6 - photos.length;
    if (available <= 0) {
      setUploadNotice("A product can have up to 6 images.");
      return;
    }
    setUploading(true);
    setUploadNotice("Compressing and uploading images…");
    try {
      const selected = Array.from(files).slice(0, available);
      const productId = form.id || slugify(form.name) || "unsorted";
      const uploaded = await Promise.all(selected.map(async (file) => uploadProductImage(await compressProductImage(file), productId)));
      const next = [...photos, ...uploaded];
      onChange("images", next);
      onChange("photo", next[0]);
      setUploadNotice(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded. Save the product to publish.`);
    } catch (error) {
      setUploadNotice(error instanceof Error ? error.message : "Could not process the selected images.");
    } finally {
      setUploading(false);
    }
  }

  function removeProductImage(index: number) {
    const next = photos.filter((_, photoIndex) => photoIndex !== index);
    onChange("images", next.length ? next : undefined);
    onChange("photo", next[0]);
  }

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
          <select
            className="admin-input"
            value={form.category}
            onChange={(event) => {
              onChange("category", event.target.value);
              onChange("subcategory", undefined);
            }}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subcategory">
          <select className="admin-input" value={form.subcategory ?? ""} onChange={(event) => onChange("subcategory", event.target.value || undefined)}>
            <option value="">None</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Status">
        <select className="admin-input" value={form.status} onChange={(event) => onChange("status", event.target.value as ProductStatus)}>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Price">
          <input className="admin-input" type="number" value={form.price} onChange={(event) => onChange("price", Number(event.target.value))} />
        </Field>
        <Field label="Sale price">
          <input className="admin-input" type="number" value={form.salePrice ?? ""} onChange={(event) => onChange("salePrice", event.target.value ? Number(event.target.value) : undefined)} />
        </Field>
        <Field label={hasSizedStock(form) ? "Inventory (sum of sizes)" : "Inventory"}>
          <input className="admin-input" type="number" value={stockTotal(form)} disabled={hasSizedStock(form)} onChange={(event) => onChange("inventory", Number(event.target.value))} />
        </Field>
      </div>
      <Field label="Stock by size (optional, e.g. S:3, M:5, L:2)">
        <input className="admin-input" value={Object.entries(form.sizeInventory ?? {}).map(([size, stock]) => `${size}:${stock}`).join(", ")} onChange={(event) => onChange("sizeInventory", Object.fromEntries(event.target.value.split(",").map((item) => item.trim().split(":" )).filter(([size, stock]) => size && stock !== undefined).map(([size, stock]) => [size, Math.max(0, Number(stock) || 0)])))} />
      </Field>
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
      <Field label="Product images (up to 6, stored in Cloud Storage)">
        <input className="admin-input" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || photos.length >= 6} onChange={(event) => { void addProductImages(event.target.files); event.target.value = ""; }} />
      </Field>
      {uploadNotice && <p role="status" className="text-xs font-semibold text-mute">{uploadNotice}</p>}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {photos.map((photo, index) => (
            <div key={`${index}-${photo.slice(-12)}`} className="relative aspect-[4/5] overflow-hidden border border-line bg-[#f4f4f4]">
              <Image src={photo} alt={`Product preview ${index + 1}`} fill sizes="160px" unoptimized={photo.startsWith("data:")} className="object-cover" />
              <button type="button" className="absolute right-1 top-1 grid size-7 place-items-center bg-white/90 text-red-700" aria-label={`Remove image ${index + 1}`} onClick={() => removeProductImage(index)}><Trash2 size={14} /></button>
              {index === 0 && <span className="absolute bottom-1 left-1 bg-green px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Cover</span>}
            </div>
          ))}
        </div>
      )}
      <button className="admin-button w-full" onClick={onSave} disabled={!firebaseReady || uploading}>
        <Save size={16} /> Save product
      </button>
    </Panel>
  );
}

async function uploadProductImage(image: Blob, productId: string) {
  const token = await auth?.currentUser?.getIdToken();
  const body = new FormData();
  body.append("file", image);
  body.append("productId", productId);
  const response = await fetch("/api/admin/uploads", { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {}, body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Upload failed.");
  return data.url as string;
}

async function compressProductImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
  if (file.size > 12 * 1024 * 1024) throw new Error(`${file.name} is larger than 12 MB.`);

  const bitmap = await createImageBitmap(file);
  const maxDimension = 1400;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error(`Could not process ${file.name}.`);
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (quality: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(`Could not encode ${file.name}.`))), "image/webp", quality));
  let quality = 0.82;
  let result = await encode(quality);
  while (result.size > 1_100_000 && quality > 0.48) {
    quality -= 0.08;
    result = await encode(quality);
  }
  if (result.size > 3_000_000) throw new Error(`${file.name} could not be compressed enough. Choose a smaller image.`);
  return result;
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
    <section className="border border-line bg-white p-5">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">Catalog</p>
          <h2 className="text-3xl font-bold">Products</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
          <label className="flex h-11 items-center gap-2 border border-line bg-white px-3">
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
                  <div className="text-xs text-mute">{product.sku}</div>
                </td>
                <td>{categoryMap.get(product.category) ?? product.category}</td>
                <td>
                  ₹{product.price.toLocaleString("en-IN")}
                  {product.salePrice ? <span className="ml-2 text-accent">₹{product.salePrice.toLocaleString("en-IN")}</span> : null}
                </td>
                <td className={product.inventory <= product.lowStockAt ? "font-bold text-accent" : ""}>{product.inventory}</td>
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
    <div className="border border-line bg-white p-5">
      <div className="mb-5 grid size-10 place-items-center border border-line">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-mute">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border border-line bg-white p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">{kicker}</p>
        <h2 className="text-3xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-black">
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
    <section className="border border-line bg-white p-5">
      <h2 className="text-3xl font-bold">{title}</h2>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 border border-line bg-white p-4">
            <div>
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-mute">{item.meta}</p>
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

type StockSnapshot = Pick<Product, "inventory" | "sizeInventory">;

function hasSizedStock(product: StockSnapshot) {
  return Object.keys(product.sizeInventory ?? {}).length > 0;
}

/** With per-size stock the total is always the sum of the sizes. */
function stockTotal(product: StockSnapshot) {
  return hasSizedStock(product)
    ? Object.values(product.sizeInventory ?? {}).reduce((sum, count) => sum + Number(count || 0), 0)
    : Number(product.inventory) || 0;
}

/** Relative changes that turn `before` into `after`. */
function stockDeltas(before: StockSnapshot, after: StockSnapshot): StockLine[] {
  if (!hasSizedStock(after)) {
    const delta = stockTotal(after) - Number(before.inventory ?? 0);
    return delta ? [{ delta }] : [];
  }
  const sizes = new Set([...Object.keys(before.sizeInventory ?? {}), ...Object.keys(after.sizeInventory ?? {})]);
  return [...sizes]
    .map((size) => ({ size, delta: Number(after.sizeInventory?.[size] ?? 0) - Number(before.sizeInventory?.[size] ?? 0) }))
    .filter((line) => line.delta !== 0);
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
