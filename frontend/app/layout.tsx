import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { Providers } from "./providers";
import {
  SITE_URL, SITE_NAME, SITE_TITLE, SITE_TITLE_EN, SITE_DESCRIPTION, SITE_DESCRIPTION_EN,
  getSiteJsonLd, canonicalFor, altLanguages,
} from "@/lib/seo";
import { getServerLocale, getServerPath } from "@/lib/i18n-server";

// Jen reálně používané řezy — šetří přenos. 700 (font-bold) se nikde nepoužívá;
// kurzíva nadpisů taky ne (kurzíva je jen na těle/motto). display:swap = text se
// vykreslí hned náhradním písmem, nečeká se na font (default next/font, ponecháno).
const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

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
    <html lang={locale} className={`${cormorant.variable} ${dmSans.variable} h-full antialiased`}>
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
