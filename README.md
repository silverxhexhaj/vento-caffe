# Vento Caffè

A multilingual coffee subscription and ordering platform for both business and home customers. The core offer: premium coffee cialde delivered monthly, with a free espresso machine included when customers commit to recurring orders.

The platform includes a customer-facing storefront, a lead generation system via free sample bookings, and a full internal admin and CRM layer for managing orders, products, businesses, agents, inventory, notifications, and growth projections.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Server Actions)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS, Storage)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **i18n**: [next-intl](https://next-intl-docs.vercel.app/) (Albanian, English, Italian)
- **Charts**: [Recharts](https://recharts.org/)
- **Language**: TypeScript

## Features

### Storefront
- Homepage with hero, trust badges, product preview, business packages, and video showcase
- Shop with product listing, detail pages, quantity stepper, and add-to-cart
- Cart with subscription toggle and free machine logic
- Checkout with shipping address collection and order creation
- Profile area with order history, address management, and password change

### Lead Generation
- Free sample booking form on the homepage (calendar picker, business qualification fields)
- Sample bookings stored in Supabase, visible in admin
- Automatic business record and admin notification on user signup

### Admin & CRM
- Dashboard with KPIs: total orders, revenue, active accounts, subscription orders
- Order management with status control, item editing, and total overrides
- Product management with images, pricing, stock, and publish controls
- Business CRM with pipeline stages, activity timeline, and agent assignment
- Agent management
- Sample booking review and conversion to business records
- Admin notifications for new orders and signups
- Growth projections tool

### Internationalization
- Three languages: Albanian (sq, default), English (en), Italian (it)
- All routes prefixed with locale (`/sq/shop`, `/en/shop`, etc.)
- Translation files in `src/messages/`

## Project Structure

```
src/
├── app/
│   ├── [locale]/              # Locale-prefixed routes
│   │   ├── page.tsx           # Homepage
│   │   ├── shop/              # Shop listing & product detail
│   │   ├── checkout/          # Checkout
│   │   ├── profile/           # User profile & order history
│   │   ├── about/             # About page
│   │   ├── admin/             # Admin dashboard & CRUD pages
│   │   └── legal/             # Privacy, Terms, Shipping
│   └── auth/callback/         # OAuth/magic link callback
├── components/
│   ├── admin/                 # Admin dashboard, tables, forms
│   ├── auth/                  # Auth modal, provider, button
│   ├── home/                  # Hero, sample booking, showcase
│   ├── layout/                # Shell, nav, footer, cart drawer
│   ├── profile/               # Profile tabs, forms, order history
│   ├── shop/                  # Product cards, gallery, trust badges
│   └── ui/                    # Shared primitives (Button, Input, Calendar)
├── data/                      # Static content helpers
├── i18n/                      # next-intl configuration
├── lib/
│   ├── actions/               # Server actions (orders, admin, profile, etc.)
│   ├── cart.tsx               # Cart context
│   ├── data/                  # Data fetching (products, packages)
│   ├── supabase/              # Supabase clients, types, middleware
│   └── utils/                 # Pricing helpers
├── messages/                  # Translation JSON files (en, it, sq)
└── proxy.ts                   # Middleware (i18n + Supabase session)

supabase/
└── migrations/                # SQL migrations (001–019)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project

### Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Run the SQL migrations in `supabase/migrations/` in order (001 through 019) against your Supabase project. These create all tables, indexes, RLS policies, triggers, and enums.

### Build for Production

```bash
npm run build
npm start
```

## Key Data Model

| Table | Purpose |
|---|---|
| `profiles` | User profiles (extends Supabase auth) |
| `products` | Coffee cialde and machine products |
| `orders` / `order_items` | Customer orders |
| `carts` | Persisted cart state |
| `sample_bookings` | Free sample booking requests |
| `businesses` | CRM business records |
| `business_activities` | Business activity log |
| `agents` / `business_agents` | Sales agents and assignments |
| `admin_notifications` | Internal admin alerts |
| `stock_movements` | Inventory tracking |
| `newsletter_subscribers` | Newsletter signups |

## License

Private - All rights reserved.
