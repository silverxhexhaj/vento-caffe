import Link from "next/link";
import Image from "next/image";
import { Product } from "@/data/products";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isMachine = product.type === "machine";
  
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-[var(--border)] mb-4 overflow-hidden">
        <Image
          src={product.images[0] || "/images/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.soldOut && (
          <div className="absolute inset-0 bg-[var(--background)]/80 flex items-center justify-center">
            <span className="text-sm uppercase tracking-widest">Sold out</span>
          </div>
        )}
        {isMachine && !product.soldOut && (
          <div className="absolute top-4 right-4 bg-[var(--foreground)] text-[var(--background)] px-3 py-1 text-xs uppercase tracking-wider">
            Free with subscription
          </div>
        )}
      </div>

      {/* Product Info */}
      <div>
        <h3 className="text-sm uppercase tracking-wide font-medium mb-1 group-hover:underline">
          {product.name}
        </h3>
        {product.contents && (
          <p className="text-sm text-muted mb-2">{product.contents}</p>
        )}
        <p className="text-sm">
          {product.soldOut ? (
            <span className="text-muted">Sold out</span>
          ) : isMachine ? (
            <span>
              {formatPrice(product.price)} <span className="text-muted">or FREE with subscription</span>
            </span>
          ) : (
            formatPrice(product.price)
          )}
        </p>
      </div>
    </Link>
  );
}
