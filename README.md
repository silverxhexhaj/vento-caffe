# Vento Caffè

A minimalist marketing and e-commerce website for Vento Caffè, a specialty coffee brand. Built with Next.js 16, Tailwind CSS v4, and TypeScript.

## Features

- **Homepage**: Manifesto hero, product preview, lifestyle section, stores preview, playlist marquee, newsletter signup
- **Shop**: Product listing and detail pages with variant selector, quantity stepper, and add-to-cart functionality
- **Cart**: Client-side cart with localStorage persistence
- **Stores**: Location listings with addresses and hours
- **Daily & Collaborations**: Editorial content sections
- **Responsive**: Mobile-first design with smooth transitions
- **Accessible**: Semantic HTML, focus states, skip links, ARIA labels
- **SEO**: Meta tags, Open Graph, structured data ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── about/             # About page
│   ├── shop/              # Shop listing & product detail
│   ├── stores/            # Store locations
│   ├── daily/             # Daily editorial
│   ├── collaborations/    # Collaborations editorial
│   └── legal/             # Legal pages
├── components/
│   ├── layout/            # Navigation, Footer, CartDrawer
│   ├── home/              # Homepage sections
│   ├── shop/              # Product components
│   ├── stores/            # Store components
│   ├── editorial/         # Editorial card
│   └── ui/                # Reusable UI components
├── data/                  # Content as TypeScript objects
│   ├── products.ts        # Product catalog
│   ├── stores.ts          # Store locations
│   ├── content.ts         # Brand copy & content
│   └── navigation.ts      # Navigation items
└── lib/
    ├── cart.tsx           # Cart context & hooks
    └── utils.ts           # Helper functions
```

## Editing Content

All content is stored in TypeScript files in the `src/data/` directory. No database or CMS required.

### Products (`src/data/products.ts`)

```typescript
{
  slug: "tramontana",        // URL slug
  name: "Tramontana",        // Display name
  tastingNotes: "Chocolate, hazelnut, honey",
  price: 18,                 // Price in EUR
  soldOut: false,
  featured: true,            // Show on homepage
  images: ["/images/products/tramontana-1.jpg"],
  origin: "Ethiopia",
  variety: "Heirloom",
  process: "Washed",
  weight: "250g",
  description: "Product description..."
}
```

### Stores (`src/data/stores.ts`)

```typescript
{
  id: "milano-centro",
  name: "Vento Centro",
  address: "Via Tortona 27",
  city: "20144 Milano",
  hours: "Mon-Fri 7:30-19:00",
  openingSoon: false,        // Shows "Opening Soon" badge
  image: "/images/stores/centro.jpg",
  mapUrl: "https://google.com/maps/..."
}
```

### Brand Copy (`src/data/content.ts`)

Edit hero text, brand statements, about page content, newsletter copy, footer text, and more.

## Adding Images

1. Place images in `public/images/` directory
2. Reference them in data files as `/images/filename.jpg`
3. Recommended sizes:
   - Products: 800×800px (square)
   - Stores: 1200×900px (4:3 ratio)
   - Editorial: 1200×800px (3:2 ratio)

## Design Tokens

Design tokens are defined in `src/app/globals.css`:

- **Colors**: Background (#FAFAFA), Foreground (#1A1A1A), Muted (#6B6B6B), Border (#E5E5E5)
- **Typography**: System fonts with serif for headings, sans-serif for body
- **Spacing**: 8px base grid (8, 16, 24, 32, 48, 64, 96, 128)

## Cart System

The cart uses React Context with localStorage persistence:

```typescript
import { useCart } from "@/lib/cart";

const { items, addItem, removeItem, totalItems, totalPrice } = useCart();
```

Checkout is stubbed—implement your payment provider integration in the `handleCheckout` function in `CartDrawer.tsx`.

## Customization

### Changing the Brand Name

1. Update `content.brand.name` in `src/data/content.ts`
2. Update `metadata` in `src/app/layout.tsx`
3. Update logo text in `Navigation.tsx` and `MobileMenu.tsx`

### Adding New Pages

1. Create a new folder in `src/app/` with a `page.tsx` file
2. Add the route to `mainNavItems` in `src/data/navigation.ts`

### Changing Colors

Edit the CSS custom properties in `src/app/globals.css`:

```css
:root {
  --background: #FAFAFA;
  --foreground: #1A1A1A;
  --muted: #6B6B6B;
  --border: #E5E5E5;
}
```

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## License

Private - All rights reserved.

---

Built with care for Vento Caffè.
