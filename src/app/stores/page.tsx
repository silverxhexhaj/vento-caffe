import { Metadata } from "next";
import { stores } from "@/data/stores";
import StoreCard from "@/components/stores/StoreCard";

export const metadata: Metadata = {
  title: "Stores",
  description: "Find our coffee shops in Milano. Raw and singular spaces designed for the ritual of coffee.",
};

export default function StoresPage() {
  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-muted mb-2">
            Vento Caffè
          </p>
          <h1 className="text-h1 font-serif">Stores</h1>
        </div>

        {/* Intro */}
        <p className="text-lg text-muted max-w-2xl mb-12">
          Raw and singular coffee shops. Sharp and minimalist spaces where 
          coffee is a ritual, and time slows down.
        </p>

        {/* Store List */}
        <div>
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>

        {/* Map Note */}
        <div className="mt-16 pt-16 border-t border-[var(--border)]">
          <p className="text-sm text-muted">
            All our stores serve specialty coffee, fresh pastries, and light fare.
            <br />
            Open 7 days a week. Take your time. Enjoy your coffee.
          </p>
        </div>
      </div>
    </div>
  );
}
