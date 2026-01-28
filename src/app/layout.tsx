import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vento Caffè | Specialty Coffee Roasted in Milano",
    template: "%s | Vento Caffè",
  },
  description:
    "A brand of specialty coffee, roasted in Milano. Raw and singular coffee shops. Sharp and minimalist.",
  keywords: [
    "specialty coffee",
    "coffee roasters",
    "Milano",
    "Italian coffee",
    "coffee shop",
  ],
  authors: [{ name: "Vento Caffè" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ventocaffe.com",
    siteName: "Vento Caffè",
    title: "Vento Caffè | Specialty Coffee Roasted in Milano",
    description:
      "A brand of specialty coffee, roasted in Milano. Raw and singular coffee shops. Sharp and minimalist.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vento Caffè | Specialty Coffee Roasted in Milano",
    description:
      "A brand of specialty coffee, roasted in Milano. Raw and singular coffee shops. Sharp and minimalist.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <CartProvider>
          <Navigation />
          <main id="main-content">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
