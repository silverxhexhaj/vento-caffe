// TODO: Next.js 16 deprecated middleware.ts in favor of proxy.ts
// This file should be migrated once next-intl adds support for the proxy convention.
// See: https://nextjs.org/docs/messages/middleware-to-proxy

import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { defaultLocale, locales, localePrefix } from "./i18n/config";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware({
  defaultLocale,
  locales,
  localePrefix,
});

export async function middleware(request: NextRequest) {
  // First, handle Supabase auth session refresh
  const supabaseResponse = await updateSession(request);

  // Then, handle internationalization
  const intlResponse = intlMiddleware(request);

  // Merge cookies from Supabase response into intl response
  if (supabaseResponse.cookies.getAll().length > 0) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
