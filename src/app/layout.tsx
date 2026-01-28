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
    default: "Vento Caffè | Premium Coffee Cialde Delivered Monthly",
    template: "%s | Vento Caffè",
  },
  description:
    "Premium Italian coffee cialde delivered monthly. Get a FREE espresso machine when you subscribe. Authentic espresso at home, made simple.",
  keywords: [
    "coffee cialde",
    "ESE pods",
    "espresso machine",
    "coffee subscription",
    "Italian coffee",
    "monthly delivery",
    "free espresso machine",
  ],
  authors: [{ name: "Vento Caffè" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ventocaffe.al",
    siteName: "Vento Caffè",
    title: "Vento Caffè | Premium Coffee Cialde Delivered Monthly",
    description:
      "Premium Italian coffee cialde delivered monthly. Get a FREE espresso machine when you subscribe.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vento Caffè | Premium Coffee Cialde Delivered Monthly",
    description:
      "Premium Italian coffee cialde delivered monthly. Get a FREE espresso machine when you subscribe.",
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
