export interface Product {
  slug: string;
  name: string;
  tastingNotes: string;
  price: number;
  soldOut: boolean;
  featured: boolean;
  images: string[];
  origin: string;
  variety: string;
  process: string;
  weight: string;
  description: string;
}

export const products: Product[] = [
  {
    slug: "tramontana",
    name: "Tramontana",
    tastingNotes: "Chocolate, hazelnut, honey",
    price: 18,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/tramontana-1.jpg",
      "/images/products/tramontana-2.jpg",
    ],
    origin: "Ethiopia, Yirgacheffe",
    variety: "Heirloom",
    process: "Washed",
    weight: "250g",
    description: "A cold northern wind brings clarity. This single-origin Ethiopian captures the essence of high-altitude terroir with delicate floral notes and a honey-sweet finish.",
  },
  {
    slug: "scirocco",
    name: "Scirocco",
    tastingNotes: "Citrus, bergamot, caramel",
    price: 22,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/scirocco-1.jpg",
      "/images/products/scirocco-2.jpg",
    ],
    origin: "Colombia, Huila",
    variety: "Caturra, Castillo",
    process: "Natural",
    weight: "250g",
    description: "Warm Mediterranean winds carrying stories from distant shores. A Colombian natural with vibrant citrus acidity and a lasting caramel sweetness.",
  },
  {
    slug: "maestrale",
    name: "Maestrale",
    tastingNotes: "Red berries, dark chocolate, tobacco",
    price: 24,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/maestrale-1.jpg",
      "/images/products/maestrale-2.jpg",
    ],
    origin: "Guatemala, Antigua",
    variety: "Bourbon",
    process: "Honey",
    weight: "250g",
    description: "The master wind of the western Mediterranean. A complex Guatemalan honey process with layers of berry fruit and deep chocolate undertones.",
  },
  {
    slug: "levante",
    name: "Levante",
    tastingNotes: "Jasmine, peach, vanilla",
    price: 26,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/levante-1.jpg",
      "/images/products/levante-2.jpg",
    ],
    origin: "Kenya, Nyeri",
    variety: "SL28, SL34",
    process: "Washed",
    weight: "250g",
    description: "Rising from the east with the morning sun. A Kenyan gem with bright, wine-like acidity and elegant floral aromatics.",
  },
  {
    slug: "ponente",
    name: "Ponente",
    tastingNotes: "Almond, brown sugar, dried fig",
    price: 20,
    soldOut: true,
    featured: false,
    images: [
      "/images/products/ponente-1.jpg",
      "/images/products/ponente-2.jpg",
    ],
    origin: "Brazil, Cerrado",
    variety: "Yellow Bourbon",
    process: "Pulped Natural",
    weight: "250g",
    description: "Setting sun winds carrying warmth. A Brazilian classic with nutty sweetness and a smooth, comforting body.",
  },
  {
    slug: "espresso-pack",
    name: "Espresso Pack",
    tastingNotes: "Scirocco + Maestrale + Tramontana",
    price: 58,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/espresso-pack-1.jpg",
    ],
    origin: "Various",
    variety: "Mixed",
    process: "Mixed",
    weight: "3 × 250g",
    description: "Three winds, one journey. Our curated selection of espresso-optimized roasts for those who seek variety.",
  },
];

export const grindOptions = [
  { id: "whole", label: "Whole Beans" },
  { id: "v60", label: "V60 / Chemex" },
  { id: "french", label: "French Press" },
  { id: "cold", label: "Cold Brew" },
  { id: "espresso", label: "Espresso" },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}
