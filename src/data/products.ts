export type Translator = {
  (key: string, values?: Record<string, string | number>): string;
  raw: (key: string) => unknown;
};

interface ProductSeed {
  slug: string;
  price: number;
  soldOut: boolean;
  featured: boolean;
  images: string[];
  type: "cialde" | "machine";
  nameKey: string;
  descriptionKey: string;
  contentsKey?: string;
  highlightsKey?: string;
}

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

const productSeeds: ProductSeed[] = [
  {
    slug: "classic-cialde",
    price: 5500,
    soldOut: false,
    featured: true,
    images: ["/images/products/classic-cialde-1.png", "/images/products/classic-cialde-2.jpg"],
    type: "cialde",
    nameKey: "products.classicCialde.name",
    descriptionKey: "products.classicCialde.description",
    contentsKey: "products.classicCialde.contents",
    highlightsKey: "products.classicCialde.highlights",
  },
  {
    slug: "decaffeinato-cialde",
    price: 6500,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/decaffeinato-cialde-1.png",
      "/images/products/decaffeinato-cialde-2.jpg",
    ],
    type: "cialde",
    nameKey: "products.decaffeinatoCialde.name",
    descriptionKey: "products.decaffeinatoCialde.description",
    contentsKey: "products.decaffeinatoCialde.contents",
    highlightsKey: "products.decaffeinatoCialde.highlights",
  },
  {
    slug: "espresso-machine",
    price: 15500,
    soldOut: false,
    featured: true,
    images: [
      "/images/products/espresso-machine-1.png",
      "/images/products/espresso-machine-2.jpg",
    ],
    type: "machine",
    nameKey: "products.espressoMachine.name",
    descriptionKey: "products.espressoMachine.description",
    highlightsKey: "products.espressoMachine.highlights",
  },
];

export const MACHINE_SLUG = "espresso-machine";
export const productSlugs = productSeeds.map((product) => product.slug);

const resolveProduct = (seed: ProductSeed, t: Translator): Product => ({
  slug: seed.slug,
  name: t(seed.nameKey),
  description: t(seed.descriptionKey),
  price: seed.price,
  soldOut: seed.soldOut,
  featured: seed.featured,
  images: seed.images,
  type: seed.type,
  contents: seed.contentsKey ? t(seed.contentsKey) : undefined,
  highlights: seed.highlightsKey
    ? (t.raw(seed.highlightsKey) as string[])
    : undefined,
});

export const getProductSeedBySlug = (slug: string) =>
  productSeeds.find((product) => product.slug === slug);

export function getProductBySlug(slug: string, t: Translator): Product | undefined {
  const seed = getProductSeedBySlug(slug);
  return seed ? resolveProduct(seed, t) : undefined;
}

export function getProducts(t: Translator): Product[] {
  return productSeeds.map((seed) => resolveProduct(seed, t));
}

export function getFeaturedProducts(t: Translator): Product[] {
  return getProducts(t).filter((p) => p.featured);
}

export function getCialdeProducts(t: Translator): Product[] {
  return getProducts(t).filter((p) => p.type === "cialde");
}

export function getMachineProduct(t: Translator): Product | undefined {
  return getProducts(t).find((p) => p.type === "machine");
}

export function getMachineSeed() {
  return productSeeds.find((product) => product.type === "machine");
}
