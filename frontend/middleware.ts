import { NextResponse, type NextRequest } from "next/server";

/**
 * Jazyk podle URL: `/en/...` = anglicky, vše ostatní = česky (výchozí). Prefix
 * `/en` tu odřízneme (rewrite na kanonickou cestu) a jazyk + původní cestu
 * předáme dál v hlavičkách — server tak ví, v jakém jazyce renderovat a jak
 * poskládat hreflang. Žádné duplikování rout; jeden strom slouží oběma jazykům.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const canonical = isEn ? pathname.replace(/^\/en/, "") || "/" : pathname;

  const headers = new Headers(req.headers);
  headers.set("x-locale", isEn ? "en" : "cs");
  headers.set("x-pathname", canonical);

  if (isEn) {
    const url = req.nextUrl.clone();
    url.pathname = canonical;
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Vynechá _next, api a soubory s příponou (robots.txt, sitemap.xml, llms.txt…).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
