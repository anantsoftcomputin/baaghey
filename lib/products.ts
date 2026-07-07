export type ProductStatus = "active" | "draft" | "archived";

export type Product = {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  salePrice?: number;
  color: string;
  craft: string;
  sku: string;
  status: ProductStatus;
  featured: boolean;
  inventory: number;
  lowStockAt: number;
  sizes: string[];
  tags: string[];
  image: string;
  imageDataUrl?: string;
  description?: string;
  details?: string;
  care?: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  featured: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  code: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  appliesTo: string[];
};

export const categories: Category[] = [
  {
    id: "shirts",
    name: "Bandhani Shirts",
    description: "Collared, boxy, and easy shirts led by hand-tied Bandhej.",
    sortOrder: 1,
    featured: true,
  },
  {
    id: "dresses",
    name: "Shirt Dresses",
    description: "One-piece silhouettes with the movement of Bandhani.",
    sortOrder: 2,
    featured: true,
  },
  {
    id: "overshirts",
    name: "Overshirts",
    description: "Layering pieces with Kantha details and soft structure.",
    sortOrder: 3,
    featured: true,
  },
];

export const products: Product[] = [
  {
    id: "teal-bandhani-full-sleeve-shirt",
    name: "Teal Bandhani Full-Sleeve Shirt",
    category: "shirts",
    material: "Hand-dyed cotton",
    price: 2999,
    color: "Teal",
    craft: "Full-sleeve shirt with tiny hand-tied knots throughout, forming intricate patterns.",
    sku: "BAG-SH-TEAL-2999",
    status: "active",
    featured: true,
    inventory: 15,
    lowStockAt: 4,
    sizes: ["S", "M", "L", "XL"],
    tags: ["shirt", "teal", "full sleeve", "bandhani", "hand tied"],
    image:
      "radial-gradient(circle at 22% 18%, #fffdf1 0 2px, transparent 3px), radial-gradient(circle at 72% 54%, #fffdf1 0 2px, transparent 3px), radial-gradient(circle at 42% 78%, #fffdf1 0 2px, transparent 3px), linear-gradient(135deg, #007a78, #005c61)",
    description:
      "Bandhani is a 5000 year old traditional resist-dyeing process, in which the fabric is pinched and tied with thread before being dyed to create a pattern of small dots.",
    details:
      "Full-sleeve shirt with tiny hand-tied knots throughout, forming intricate patterns.",
    care:
      "This garment is handmade and hand-dyed, so expect some charming irregularities in each piece. Over time color may naturally fade, adding character to your piece. Hand wash and rinse in cold water for best results. Wash dark colors separately to prevent any color transfer.",
  },
  {
    id: "kamal-bandhani-shirt",
    name: "Kamal Bandhani Shirt",
    category: "shirts",
    material: "Mulmul cotton",
    price: 4800,
    salePrice: 4200,
    color: "Madder red",
    craft: "Relaxed collared shirt with hand-tied lotus-dot Bandhej",
    sku: "BAG-SH-KAMAL-RED",
    status: "active",
    featured: true,
    inventory: 18,
    lowStockAt: 5,
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["shirt", "mulmul", "bandhej", "festive"],
    image:
      "radial-gradient(circle at 20% 18%, #fff7e6 0 2px, transparent 3px), radial-gradient(circle at 78% 60%, #fff7e6 0 2px, transparent 3px), linear-gradient(135deg, #a83228, #f07178)",
  },
  {
    id: "shyama-gaji-silk-shirt",
    name: "Shyama Gaji Silk Shirt",
    category: "shirts",
    material: "Gaji silk",
    price: 6900,
    color: "Indigo tide",
    craft: "Deep indigo silk shirt with tiny tied constellations",
    sku: "BAG-SH-SHYAMA-IND",
    status: "active",
    featured: true,
    inventory: 9,
    lowStockAt: 4,
    sizes: ["S", "M", "L"],
    tags: ["shirt", "gaji silk", "indigo", "premium"],
    image:
      "radial-gradient(circle at 28% 40%, #fff7e6 0 2px, transparent 3px), radial-gradient(circle at 64% 28%, #f7db54 0 2px, transparent 3px), linear-gradient(135deg, #203a63, #386b91)",
  },
  {
    id: "sugandha-shirt-dress",
    name: "Sugandha Shirt Dress",
    category: "dresses",
    material: "Cotton silk",
    price: 7500,
    color: "Kesar yellow",
    craft: "Modern shirt dress with saffron Bandhani movement",
    sku: "BAG-DR-SUGANDHA-KES",
    status: "active",
    featured: false,
    inventory: 11,
    lowStockAt: 3,
    sizes: ["XS", "S", "M", "L"],
    tags: ["dress", "cotton silk", "kesar"],
    image:
      "radial-gradient(circle at 50% 50%, #a83228 0 2px, transparent 3px), radial-gradient(circle at 25% 24%, #486a31 0 2px, transparent 3px), linear-gradient(135deg, #f7db54, #f3a447)",
  },
  {
    id: "kantha-bandhej-overshirt",
    name: "Kantha Bandhej Overshirt",
    category: "overshirts",
    material: "Hand finish",
    price: 5600,
    color: "Neem green",
    craft: "Boxy overshirt with Kantha edges and hand-tied dots",
    sku: "BAG-OS-KANTHA-NEEM",
    status: "active",
    featured: false,
    inventory: 6,
    lowStockAt: 4,
    sizes: ["S", "M", "L", "XL"],
    tags: ["overshirt", "kantha", "neem"],
    image:
      "radial-gradient(circle at 18% 72%, #f7db54 0 2px, transparent 3px), radial-gradient(circle at 70% 26%, #fff7e6 0 2px, transparent 3px), linear-gradient(135deg, #223823, #486a31)",
  },
];

export const campaigns: Campaign[] = [
  {
    id: "navratri-edit",
    name: "Navratri Bandhej Edit",
    code: "RAAS15",
    discountPercent: 15,
    startsAt: "2026-09-20",
    endsAt: "2026-10-05",
    active: true,
    appliesTo: ["shirts", "dresses"],
  },
];

export const stories = [
  {
    city: "Jamnagar",
    title: "Brass light, clean tailoring",
    copy: "Jali shadows and warm metal details guide the trims, buttons, and quiet geometry of the shirts.",
  },
  {
    city: "Porbandar",
    title: "Coastal blues for daily wear",
    copy: "Indigo, ivory, and soft cottons keep the craft easy to style beyond festivals and ceremonies.",
  },
  {
    city: "Veraval",
    title: "Harbor color, modern form",
    copy: "Kesar, coral, black, and neem move through boxy shirts, co-ords, and shirt dresses.",
  },
];
