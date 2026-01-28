"use client";

import { useState } from "react";
import Link from "next/link";
import { Product, grindOptions } from "@/data/products";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import ProductGallery from "@/components/shop/ProductGallery";
import VariantSelector from "@/components/shop/VariantSelector";
import QuantityStepper from "@/components/shop/QuantityStepper";
import TrustBadges from "@/components/shop/TrustBadges";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedGrind, setSelectedGrind] = useState(grindOptions[0].id);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (product.soldOut) return;

    addItem({
      productSlug: product.slug,
      productName: product.name,
      grind: selectedGrind,
      quantity,
      price: product.price,
      image: product.images[0] || "/images/placeholder.svg",
    });
  };

  return (
    <div className="section">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/shop" className="text-muted hover:text-[var(--foreground)] transition-colors">
            Shop
          </Link>
          <span className="mx-2 text-muted">/</span>
          <span>{product.name}</span>
        </nav>

        {/* Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Right: Product Info */}
          <div className="space-y-8">
            {/* Name & Notes */}
            <div>
              <h1 className="text-h1 font-serif mb-2">{product.name}</h1>
              <p className="text-lg text-muted">{product.tastingNotes}</p>
            </div>

            {/* Price */}
            <div>
              <p className="text-h3">
                {product.soldOut ? (
                  <span className="text-muted">Sold out</span>
                ) : (
                  <>from {formatPrice(product.price)}</>
                )}
              </p>
            </div>

            {/* Description */}
            <p className="text-muted leading-relaxed">{product.description}</p>

            {/* Variant Selector */}
            {!product.soldOut && (
              <VariantSelector
                selectedGrind={selectedGrind}
                onGrindChange={setSelectedGrind}
              />
            )}

            {/* Quantity & Add to Cart */}
            {!product.soldOut && (
              <div className="space-y-4">
                <QuantityStepper
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                />
                <button
                  onClick={handleAddToCart}
                  className="btn btn-primary w-full"
                >
                  Add to Cart — {formatPrice(product.price * quantity)}
                </button>
              </div>
            )}

            {/* Sold Out State */}
            {product.soldOut && (
              <div className="space-y-4">
                <button disabled className="btn w-full opacity-50 cursor-not-allowed">
                  Sold Out
                </button>
                <p className="text-sm text-muted text-center">
                  Sign up for our newsletter to be notified when this product is back in stock.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16">
          <TrustBadges />
        </div>

        {/* Product Specs */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">Origin</p>
            <p className="text-sm">{product.origin}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">Variety</p>
            <p className="text-sm">{product.variety}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">Process</p>
            <p className="text-sm">{product.process}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">Weight</p>
            <p className="text-sm">{product.weight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
