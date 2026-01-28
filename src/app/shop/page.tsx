import { Metadata } from "next";
import { products } from "@/data/products";
import { content } from "@/data/content";
import ProductCard from "@/components/shop/ProductCard";

export const metadata: Metadata = {
  title: "Shop",
  description: "Explore our carefully selected range of specialty coffees. From single origins to espresso blends, roasted with care in Milano.",
};

export default function ShopPage() {
  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-h1 font-serif mb-4">Shop</h1>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>

        {/* Bottom Statement */}
        <div className="max-w-2xl border-t border-[var(--border)] pt-12">
          <p className="text-h3 font-serif mb-2">
            {content.productSection.preHeading} {content.productSection.heading} {content.productSection.subHeading}.
          </p>
          <p className="text-muted">
            We are for sustainable engagement and for full responsibility.
          </p>
        </div>
      </div>
    </div>
  );
}
