"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

const actions = [
  {
    label: "New Order",
    href: "/admin/businesses",
    description: "Create order for a business",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
  },
  {
    label: "New Product",
    href: "/admin/products/new",
    description: "Add a new product",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    label: "Businesses",
    href: "/admin/businesses",
    description: "View and manage businesses",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21V6.75A2.25 2.25 0 0 1 4.5 4.5h15A2.25 2.25 0 0 1 21.75 6.75V21M3.75 9h16.5M6.75 12h.007v.008H6.75V12Zm0 3h.007v.008H6.75V15Zm0 3h.007v.008H6.75V18Zm4.5-6h.007v.008H11.25V12Zm0 3h.007v.008H11.25V15Zm0 3h.007v.008H11.25V18Zm4.5-6h.007v.008H15.75V12Zm0 3h.007v.008H15.75V15Zm0 3h.007v.008H15.75V18Z" />
      </svg>
    ),
  },
  {
    label: "New Business",
    href: "/admin/businesses/new",
    description: "Add a new business",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21V6.75A2.25 2.25 0 0 1 4.5 4.5h15A2.25 2.25 0 0 1 21.75 6.75V21M3.75 9h16.5M6.75 12h.007v.008H6.75V12Zm0 3h.007v.008H6.75V15Zm0 3h.007v.008H6.75V18Zm4.5-6h.007v.008H11.25V12Zm0 3h.007v.008H11.25V15Zm0 3h.007v.008H11.25V18Zm4.5-6h.007v.008H15.75V12Zm0 3h.007v.008H15.75V15Zm0 3h.007v.008H15.75V18Z" />
      </svg>
    ),
  },
];

export default function QuickActions() {
  const locale = useLocale();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={`/${locale}${action.href}`}
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors group"
        >
          <div className="p-2.5 bg-neutral-100 rounded-lg text-neutral-600 group-hover:bg-neutral-200 group-hover:text-neutral-900 transition-colors">
            {action.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-neutral-900 group-hover:text-neutral-700">
              {action.label}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5 truncate">
              {action.description}
            </p>
          </div>
          <svg className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      ))}
    </div>
  );
}
