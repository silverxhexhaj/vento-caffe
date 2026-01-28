import Image from "next/image";
import { Store } from "@/data/stores";

interface StoreCardProps {
  store: Store;
}

export default function StoreCard({ store }: StoreCardProps) {
  return (
    <article
      id={store.id}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12 border-b border-[var(--border)]"
    >
      {/* Store Image */}
      <div className="relative aspect-[4/3] bg-[var(--border)] overflow-hidden">
        <Image
          src={store.image || "/images/placeholder.svg"}
          alt={store.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {store.openingSoon && (
          <div className="absolute inset-0 bg-[var(--background)]/80 flex items-center justify-center">
            <span className="text-sm uppercase tracking-widest">Opening Soon</span>
          </div>
        )}
      </div>

      {/* Store Info */}
      <div className="flex flex-col justify-center">
        <h2 className="text-h2 font-serif mb-4">{store.name}</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-1">
              Address
            </p>
            <p className="text-sm">{store.address}</p>
            <p className="text-sm">{store.city}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-1">
              Hours
            </p>
            <p className="text-sm">
              {store.openingSoon ? "Coming Soon" : store.hours}
            </p>
          </div>

          {!store.openingSoon && (
            <a
              href={store.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm link-underline"
            >
              Get Directions
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
