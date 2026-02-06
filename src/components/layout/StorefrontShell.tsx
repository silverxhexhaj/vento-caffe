"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import FloatingCartButton from "./FloatingCartButton";
import MobileBottomNav from "./MobileBottomNav";

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if we're on an admin page (pattern: /{locale}/admin/...)
  const segments = pathname?.split("/") || [];
  const isAdminRoute = segments.length >= 3 && segments[2] === "admin";

  if (isAdminRoute) {
    // Admin routes render their own layout; skip storefront shell
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <main id="main-content">{children}</main>
      <Footer />
      <CartDrawer />
      <FloatingCartButton />
      <MobileBottomNav />
    </>
  );
}
