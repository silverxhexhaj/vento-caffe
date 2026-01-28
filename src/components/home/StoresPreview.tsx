import Link from "next/link";
import { stores } from "@/data/stores";

export default function StoresPreview() {
  return (
    <section className="section">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-muted mb-2">
            Vento Caffè
          </p>
          <h2 className="text-h1 font-serif">Stores</h2>
        </div>

        {/* Stores List */}
        <div className="space-y-6 mb-12">
          {stores.map((store) => (
            <div
              key={store.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between py-6 border-b border-[var(--border)]"
            >
              <div>
                <h3 className="text-lg font-medium mb-1">{store.name}</h3>
                <p className="text-sm text-muted">
                  {store.address}, {store.city}
                  {store.openingSoon && (
                    <span className="ml-2 text-xs uppercase tracking-wider">
                      — Soon
                    </span>
                  )}
                </p>
              </div>
              {!store.openingSoon && (
                <Link
                  href={`/stores#${store.id}`}
                  className="text-sm link-underline mt-2 md:mt-0"
                >
                  Learn more
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/stores" className="btn">
          Our Coffee Stores
        </Link>
      </div>
    </section>
  );
}
