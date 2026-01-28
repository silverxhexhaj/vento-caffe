import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Shipping and return policy for Vento Caffè",
};

export default function ShippingPage() {
  return (
    <div className="section">
      <div className="container">
        <div className="max-w-2xl">
          <h1 className="text-h1 font-serif mb-8">Shipping & Returns</h1>
          
          <div className="prose prose-sm">
            <p className="text-muted mb-6">
              Last updated: January 2026
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">Shipping</h2>
            <p className="text-sm text-muted mb-4">
              We ship throughout Europe. Standard delivery takes 2-3 business days 
              within Italy and 4-7 business days for the rest of Europe.
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">Free Shipping</h2>
            <p className="text-sm text-muted mb-4">
              Free shipping on all orders over €50 within Italy and €75 for the 
              rest of Europe.
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">Returns</h2>
            <p className="text-sm text-muted mb-4">
              Due to the perishable nature of our products, we cannot accept returns 
              on coffee. If you receive a damaged or incorrect product, please 
              contact us within 48 hours of delivery.
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">Contact Us</h2>
            <p className="text-sm text-muted">
              If you have any questions about shipping or returns, please contact us 
              at hello@ventocaffe.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
