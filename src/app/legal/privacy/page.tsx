import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Vento Caffè",
};

export default function PrivacyPage() {
  return (
    <div className="section">
      <div className="container">
        <div className="max-w-2xl">
          <h1 className="text-h1 font-serif mb-8">Privacy Policy</h1>
          
          <div className="prose prose-sm">
            <p className="text-muted mb-6">
              Last updated: January 2026
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">Information We Collect</h2>
            <p className="text-sm text-muted mb-4">
              We collect information you provide directly to us, such as when you 
              create an account, make a purchase, sign up for our newsletter, or 
              contact us for support.
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">How We Use Your Information</h2>
            <p className="text-sm text-muted mb-4">
              We use the information we collect to process your orders, communicate 
              with you, and improve our services.
            </p>

            <h2 className="text-lg font-medium mt-8 mb-4">Contact Us</h2>
            <p className="text-sm text-muted">
              If you have any questions about this Privacy Policy, please contact us 
              at hello@ventocaffe.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
