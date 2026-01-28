export interface Product {
  slug: string;
  name: string;
  description: string;
  price: number;
  soldOut: boolean;
  featured: boolean;
  images: string[];
  type: "cialde" | "machine";
  contents?: string;
  highlights?: string[];
}

export const products: Product[] = [
  {
    slug: "classic-cialde",
    name: "Classic Cialde Box",
    description: "Our signature blend of premium Italian coffee, carefully selected and roasted to perfection. Each cialde delivers a rich, full-bodied espresso with notes of chocolate and toasted nuts. The perfect everyday coffee for true espresso lovers.",
    price: 55,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/classic-cialde-1.png",
      "/images/products/classic-cialde-2.jpg",
    ],
    type: "cialde",
    contents: "150 cialde + kit",
    highlights: [
      "150 premium ESE coffee pods",
      "Includes cups, sugar, and stirrers",
      "Medium roast blend",
      "Compatible with all ESE machines",
    ],
  },
  {
    slug: "decaffeinato-cialde",
    name: "Decaffeinato Cialde Box",
    description: "All the flavor, none of the caffeine. Our decaffeinated cialde use a natural Swiss Water process to remove caffeine while preserving the complex flavors of premium Arabica beans. Enjoy authentic Italian espresso any time of day.",
    price: 65,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/decaffeinato-cialde-1.png",
      "/images/products/decaffeinato-cialde-2.jpg",
    ],
    type: "cialde",
    contents: "150 cialde + kit",
    highlights: [
      "150 decaf ESE coffee pods",
      "Includes cups, sugar, and stirrers",
      "Swiss Water decaf process",
      "Compatible with all ESE machines",
    ],
  },
  {
    slug: "espresso-machine",
    name: "Espresso Machine",
    description: "A professional-grade ESE pod espresso machine designed for simplicity and quality. Compact, elegant, and powerful—brew barista-quality espresso at home or in the office with the push of a button. No mess, no waste, just perfect coffee.",
    price: 170,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/espresso-machine-1.png",
      "/images/products/espresso-machine-2.jpg",
    ],
    type: "machine",
    highlights: [
      "15 bar pump pressure",
      "ESE pod compatible",
      "Compact design",
      "1-year warranty",
      "FREE with monthly subscription",
    ],
  },
];

export const MACHINE_SLUG = "espresso-machine";

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getCialdeProducts(): Product[] {
  return products.filter((p) => p.type === "cialde");
}

export function getMachineProduct(): Product | undefined {
  return products.find((p) => p.type === "machine");
}
