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
  photo?: string;
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
    color: "Peacock teal",
    craft: "Camp-collar shirt tied dot by dot in flowing bel-buti vines across a deep peacock ground.",
    sku: "BAG-SH-TEAL-2999",
    status: "active",
    featured: true,
    inventory: 15,
    lowStockAt: 4,
    sizes: ["S", "M", "L", "XL"],
    tags: ["shirt", "teal", "full sleeve", "bandhani", "hand tied"],
    image:
      "radial-gradient(circle at 22% 18%, #fffdf1 0 2px, transparent 3px), radial-gradient(circle at 72% 54%, #fffdf1 0 2px, transparent 3px), linear-gradient(135deg, #007a78, #005c61)",
    photo: "/images/products/teal-full-sleeve-shirt.jpeg",
    description:
      "A relaxed camp-collar shirt in peacock teal, its surface alive with hand-tied vines and scattered dots. Each knot was pinched and bound by hand before the cloth met the dye, so no two shirts carry the exact same pattern.",
    details:
      "Full-sleeve camp-collar shirt · flowing bel-buti (vine) Bandhej worked across the body and sleeves · natural-fade hand-dye.",
    care:
      "Every piece is hand-tied and hand-dyed, so small irregularities are the signature of the craft, not a flaw. Hand wash separately in cold water; dry in shade. Colour softens gently over time and wears in like a favourite.",
  },
  {
    id: "kamal-bandhani-shirt",
    name: "Kamal Bandhani Shirt",
    category: "shirts",
    material: "Mulmul cotton",
    price: 4800,
    salePrice: 4200,
    color: "Madder red",
    craft: "Breezy mulmul camp shirt with lotus-vine Bandhej on a warm madder-red ground.",
    sku: "BAG-SH-KAMAL-RED",
    status: "active",
    featured: true,
    inventory: 18,
    lowStockAt: 5,
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["shirt", "mulmul", "bandhej", "festive", "red"],
    image:
      "radial-gradient(circle at 20% 18%, #fff7e6 0 2px, transparent 3px), radial-gradient(circle at 78% 60%, #fff7e6 0 2px, transparent 3px), linear-gradient(135deg, #a83228, #f07178)",
    photo: "/images/products/kamal-red-shirt.jpeg",
    description:
      "Kamal means lotus — and the tied vines here open like petals across soft mulmul cotton. Light enough for a coastal afternoon, rich enough for the festive evening that follows.",
    details:
      "Camp-collar short shirt · lotus-vine (kamal-bel) Bandhej · breathable mulmul cotton.",
    care:
      "Hand-tied, hand-dyed, gloriously imperfect. Hand wash separately in cold water and dry in shade to keep the madder deep.",
  },
  {
    id: "kesari-bandhani-shirt",
    name: "Kesari Bandhani Shirt",
    category: "shirts",
    material: "Handloom cotton",
    price: 3600,
    color: "Kesar yellow",
    craft: "Sunlit saffron shirt scattered with tiny single-tie ekdali dots.",
    sku: "BAG-SH-KESARI-YEL",
    status: "active",
    featured: false,
    inventory: 12,
    lowStockAt: 4,
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["shirt", "yellow", "kesar", "ekdali", "everyday"],
    image:
      "radial-gradient(circle at 30% 22%, #fffdf1 0 2px, transparent 3px), radial-gradient(circle at 68% 58%, #fffdf1 0 2px, transparent 3px), linear-gradient(135deg, #f3b229, #f7db54)",
    photo: "/images/products/kesari-yellow-shirt.jpeg",
    description:
      "The colour of marigold and morning haldi. A full-sleeve shirt strewn with ekdali — the simplest single-tied dot — so the saffron reads clean and modern with denim or wide-leg trousers.",
    details:
      "Full-sleeve button-down · single-tie ekdali Bandhej · handloom cotton with a soft matte finish.",
    care:
      "Hand wash separately in cold water; dry in shade. Expect gentle, characterful fading.",
  },
  {
    id: "firozi-crop-overshirt",
    name: "Firozi Crop Overshirt",
    category: "overshirts",
    material: "Cotton silk",
    price: 4200,
    color: "Firozi turquoise",
    craft: "Boxy cropped overshirt in firozi blue with an even field of tied dots.",
    sku: "BAG-OS-FIROZI-TRQ",
    status: "active",
    featured: false,
    inventory: 8,
    lowStockAt: 3,
    sizes: ["XS", "S", "M", "L"],
    tags: ["overshirt", "crop", "turquoise", "firozi", "layering"],
    image:
      "radial-gradient(circle at 26% 30%, #fffdf1 0 2px, transparent 3px), radial-gradient(circle at 70% 64%, #fffdf1 0 2px, transparent 3px), linear-gradient(135deg, #17a2a0, #0f8f8c)",
    photo: "/images/products/firozi-crop-overshirt.jpeg",
    description:
      "A cropped, boxy overshirt in firozi — the turquoise of temple tilework — worn open over a co-ord or buttoned as a statement. An even rain of tied dots keeps it quietly ceremonial.",
    details:
      "Boxy cropped fit · full-field cluster Bandhej · cotton-silk blend with a soft sheen.",
    care:
      "Hand wash separately in cold water; dry flat in shade.",
  },
  {
    id: "sugandha-shirt-dress",
    name: "Sugandha Shirt Dress",
    category: "dresses",
    material: "Cotton silk",
    price: 7500,
    color: "Kesar yellow",
    craft: "One-shoulder shirt dress with a draped sash and fine saffron Bandhej.",
    sku: "BAG-DR-SUGANDHA-KES",
    status: "active",
    featured: true,
    inventory: 11,
    lowStockAt: 3,
    sizes: ["XS", "S", "M", "L"],
    tags: ["dress", "cotton silk", "kesar", "one shoulder"],
    image:
      "radial-gradient(circle at 50% 50%, #a83228 0 2px, transparent 3px), radial-gradient(circle at 25% 24%, #486a31 0 2px, transparent 3px), linear-gradient(135deg, #f7db54, #f3a447)",
    photo: "/images/products/sugandha-yellow-dress.jpeg",
    description:
      "A modern one-shoulder dress with a fluid draped sash, dyed the soft yellow of sandalwood paste. Fine tied dots move down the length so the whole piece seems to shimmer as you walk.",
    details:
      "One-shoulder silhouette with draped sash · fine ekdali Bandhej · fluid cotton-silk.",
    care:
      "Dry clean recommended, or gentle cold hand wash. Dry in shade.",
  },
  {
    id: "raat-bandhani-dress",
    name: "Raat Bandhani Dress",
    category: "dresses",
    material: "Modal satin",
    price: 6900,
    color: "Midnight black",
    craft: "One-shoulder black maxi with gold-lit chaubundi dots, like stars over the sea.",
    sku: "BAG-DR-RAAT-BLK",
    status: "active",
    featured: false,
    inventory: 7,
    lowStockAt: 3,
    sizes: ["XS", "S", "M", "L"],
    tags: ["dress", "black", "maxi", "festive", "chaubundi"],
    image:
      "radial-gradient(circle at 28% 32%, #f7db54 0 2px, transparent 3px), radial-gradient(circle at 66% 60%, #fffdf1 0 2px, transparent 3px), linear-gradient(135deg, #111111, #1c1c1c)",
    photo: "/images/products/raat-black-dress.jpeg",
    description:
      "Raat — night. A one-shoulder maxi in deep black, scattered with four-tie chaubundi knots that catch the light like a coastline of stars. Black brings a sharp modern edge to a very old craft.",
    details:
      "One-shoulder floor-length dress with tie sash · four-dot chaubundi Bandhej · fluid modal satin.",
    care:
      "Hand wash separately in cold water; dry in shade. Wash darks alone to protect the depth of colour.",
  },
  {
    id: "gulaal-bandhani-sundress",
    name: "Gulaal Bandhani Sundress",
    category: "dresses",
    material: "Handloom cotton",
    price: 4300,
    color: "Rose gulaal",
    craft: "Easy fit-and-flare sundress in rose gulaal with scattered tied dots.",
    sku: "BAG-DR-GULAAL-RSE",
    status: "active",
    featured: false,
    inventory: 14,
    lowStockAt: 4,
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["dress", "pink", "gulaal", "sundress", "everyday"],
    image:
      "radial-gradient(circle at 24% 26%, #fffdf1 0 2px, transparent 3px), radial-gradient(circle at 72% 62%, #fffdf1 0 2px, transparent 3px), linear-gradient(135deg, #f3a6bd, #ef8aa8)",
    photo: "/images/products/gulaal-pink-dress.jpeg",
    description:
      "The pink of Holi gulaal, in an easy fit-and-flare sundress you can throw on all summer. Scattered single-tie dots keep it playful without tipping into costume.",
    details:
      "Strappy fit-and-flare knee-length sundress · scattered ekdali Bandhej · breathable handloom cotton.",
    care:
      "Machine wash gentle, cold, separately. Dry in shade.",
  },
  {
    id: "neel-drop-waist-dress",
    name: "Neel Drop-Waist Dress",
    category: "dresses",
    material: "Cotton mul",
    price: 5200,
    color: "Peacock teal",
    craft: "Drop-waist maxi with a gathered skirt and vine-and-dot Bandhej.",
    sku: "BAG-DR-NEEL-TEAL",
    status: "active",
    featured: false,
    inventory: 9,
    lowStockAt: 3,
    sizes: ["XS", "S", "M", "L"],
    tags: ["dress", "teal", "maxi", "drop waist"],
    image:
      "radial-gradient(circle at 30% 28%, #fffdf1 0 2px, transparent 3px), radial-gradient(circle at 68% 58%, #fffdf1 0 2px, transparent 3px), linear-gradient(135deg, #0f7d7b, #0b6360)",
    photo: "/images/products/neel-teal-dress.jpeg",
    description:
      "A drop-waist maxi with a softly gathered skirt, tied in flowing vines over the bodice and a rain of dots below. Made to move — at a garba, on a terrace, by the water.",
    details:
      "Strappy drop-waist maxi with gathered skirt · bel-buti and ekdali Bandhej · airy cotton mul.",
    care:
      "Hand wash separately in cold water; dry in shade.",
  },
  {
    id: "kantha-bandhej-overshirt",
    name: "Kantha Bandhej Overshirt",
    category: "overshirts",
    material: "Handloom cotton",
    price: 5600,
    color: "Olive neem",
    craft: "Boxy overshirt in olive neem with tied diamond dots and a hand-embroidered Kantha pocket.",
    sku: "BAG-OS-KANTHA-NEEM",
    status: "active",
    featured: true,
    inventory: 6,
    lowStockAt: 4,
    sizes: ["S", "M", "L", "XL"],
    tags: ["overshirt", "kantha", "neem", "olive"],
    image:
      "radial-gradient(circle at 18% 72%, #f7db54 0 2px, transparent 3px), radial-gradient(circle at 70% 26%, #fff7e6 0 2px, transparent 3px), linear-gradient(135deg, #223823, #486a31)",
    photo: "/images/products/kantha-olive-overshirt.jpeg",
    description:
      "Two crafts in one piece: a field of tied diamond dots across olive-neem cotton, finished with a chest pocket embroidered in running Kantha stitch. A layering shirt with real hand-work in every seam.",
    details:
      "Boxy overshirt · diamond-cluster Bandhej · hand-embroidered Kantha pocket and cuff detail · handloom cotton.",
    care:
      "Hand wash separately in cold water; dry in shade to protect both the dye and the embroidery.",
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
    city: "Kutch & Jamnagar",
    title: "Where the knot is tied",
    copy: "In the workshops of Kutch and Jamnagar, artisans raise thousands of dots by hand — a single scarf can hold forty thousand ties before it ever meets the dye.",
  },
  {
    city: "By the Saurashtra coast",
    title: "Colour, then sun",
    copy: "Cloth is dipped in madder, indigo, turmeric and pomegranate, then dried in the salt air. The tied points hold back the dye and stay pale.",
  },
  {
    city: "In your wardrobe",
    title: "Heritage, worn easy",
    copy: "We cut that same Bandhej into camp shirts, overshirts and shift dresses — made to live over denim and under a jacket, not only saved for the festival.",
  },
];

export type BandhaniStep = {
  step: string;
  gujarati: string;
  title: string;
  copy: string;
};

// The tie -> dye -> reveal story, told the way the craft actually happens.
export const bandhaniSteps: BandhaniStep[] = [
  {
    step: "01",
    gujarati: "બાંધવું",
    title: "Bind the dots",
    copy: "The cloth is marked, then pinched into thousands of tiny points and bound tightly with thread — one knot at a time, entirely by hand.",
  },
  {
    step: "02",
    gujarati: "રંગવું",
    title: "Dip in colour",
    copy: "The bound cloth is dyed in madder red, indigo, turmeric or pomegranate. Where the thread grips, the dye can't reach.",
  },
  {
    step: "03",
    gujarati: "સૂકવવું",
    title: "Dry in the sun",
    copy: "It is wrung and sun-dried in the coastal air, the colour deepening as the water leaves the weave.",
  },
  {
    step: "04",
    gujarati: "ખોલવું",
    title: "Open the knot",
    copy: "Finally the threads are pulled free and each tied point blooms into a small white dot. Print nathi — Bandhej che.",
  },
];
