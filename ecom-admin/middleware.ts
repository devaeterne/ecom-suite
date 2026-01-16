// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["en", "tr"] as const;
const DEFAULT_LOCALE = "en";
const AUTH_COOKIE = "adminAccessCookie";

function hasLocale(pathname: string) {
  const seg1 = pathname.split("/")[1];
  return LOCALES.includes(seg1 as any);
}

function getLocaleFromRequest(req: NextRequest) {
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && LOCALES.includes(cookieLocale as any))
    return cookieLocale;

  const al = req.headers.get("accept-language") || "";
  const preferred = al.split(",")[0]?.toLowerCase() ?? "";
  if (preferred.startsWith("tr")) return "tr";

  return DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Debug header: her response'a koy (istersen sonra kaldır)
  const withDebug = (r: NextResponse) => {
    r.headers.set("x-mw", "hit");
    return r;
  };

  // API'ye dokunma
  if (pathname.startsWith("/api")) return withDebug(NextResponse.next());

  // 1) Locale yoksa locale ekleyip redirect et
  if (!hasLocale(pathname)) {
    const locale = getLocaleFromRequest(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    url.search = search;
    return withDebug(NextResponse.redirect(url));
  }

  // Buradan sonra /{locale}/...
  const locale = pathname.split("/")[1];

  // 2) Login serbest
  const isLogin = pathname === `/${locale}/login`;
  if (isLogin) return withDebug(NextResponse.next());

  // 3) Auth guard (login dışı her şey)
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set("next", pathname);
    return withDebug(NextResponse.redirect(url));
  }

  return withDebug(NextResponse.next());
}

export const config = { matcher: ["/", "/((?!_next|.*\\..*).*)"] };
