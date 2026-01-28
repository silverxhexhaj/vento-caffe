import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for Vento Caffè",
};

export default function TermsPage() {
  return (
    <div className="section">
      <div className="container">
        <div className="max-w-2xl">
          <h1 className="text-h1 font-serif mb-8">Terms & Conditions</h1>
          
          <div className="prose prose-sm">
            <p className="text-muted mb-6">
              Last updated: January 2026
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">Acceptance of Terms</h2>
            <p className="text-sm text-muted mb-4">
              By accessing and using this website, you accept and agree to be bound 
              by the terms and provision of this agreement.
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">Products and Pricing</h2>
            <p className="text-sm text-muted mb-4">
              All prices are in Euros and include applicable taxes. We reserve the 
              right to modify prices at any time without prior notice.
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">Contact Us</h2>
            <p className="text-sm text-muted">
              If you have any questions about these Terms, please contact us 
              at hello@ventocaffe.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
