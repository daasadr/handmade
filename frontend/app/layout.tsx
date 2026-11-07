import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { Providers } from "./providers";
import {
  SITE_URL, SITE_NAME, SITE_TITLE, SITE_TITLE_EN, SITE_DESCRIPTION, SITE_DESCRIPTION_EN,
  getSiteJsonLd, canonicalFor, altLanguages,
} from "@/lib/seo";
import { getServerLocale, getServerPath } from "@/lib/i18n-server";

// Fonty jsou self-hostované přes @font-face v globals.css (proměnné --font-heading
// a --font-body na :root). Dřív to byl next/font/google, ale ten stahuje fonty při
// buildu z Google a build v Dockeru na ně občas nedosáhl → spadlý build. Viz globals.css.

// Jazykově citlivá metadata + canonical a hreflang pro AKTUÁLNÍ cestu (z URL).
// Platí pro celý web z jednoho místa; jednotlivé stránky si jen přepisují
// title/description (hreflang/canonical dědí odtud).
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const path = await getServerPath();
  const en = locale === "en";
  const title = en ? SITE_TITLE_EN : SITE_TITLE;
  const description = en ? SITE_DESCRIPTION_EN : SITE_DESCRIPTION;
  const url = canonicalFor(path, locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s — Handmade.net" },
    description,
    applicationName: SITE_NAME,
    keywords: [
      "Etsy SEO", "Amazon Handmade", "Fler", "optimalizace listingu", "listing optimization",
      "AI popis produktu", "klíčová slova Etsy", "Etsy tags", "handmade prodej", "sell handmade",
    ],
    authors: [{ name: SITE_NAME }],
    alternates: { canonical: url, languages: altLanguages(path) },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url,
      title,
      description,
      locale: en ? "en_US" : "cs_CZ",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Jazyk z URL (/en) — ať se stránka vykreslí ve správném jazyce už na serveru.
  const locale = await getServerLocale();
  return (
    <html lang={locale} className="h-full antialiased">
      <head>
        {/* Přednačteme hlavní (latin) řezy, ať nad ohybem neproblikne náhradní písmo. */}
        <link rel="preload" href="/fonts/cormorant-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/dmsans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Strukturovaná data pro vyhledávače i AI odpovědní enginy (GEO/AEO). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getSiteJsonLd()) }}
        />
        <Providers initialLocale={locale}>
          {children}
          <Toaster position="top-right" richColors />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
