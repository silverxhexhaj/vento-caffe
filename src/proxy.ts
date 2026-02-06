import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // First, refresh the Supabase auth session
  const sessionResponse = await updateSession(request);

  // Then, run the i18n middleware
  const intlResponse = intlMiddleware(request);

  // Merge cookies from session refresh into the i18n response
  if (intlResponse && sessionResponse) {
    sessionResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value);
    });
  }

  return intlResponse || sessionResponse || NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
