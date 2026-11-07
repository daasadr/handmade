import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { Providers } from "./providers";
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, getSiteJsonLd } from "@/lib/seo";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s — Handmade.net" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Etsy SEO", "Amazon Handmade", "Fler", "optimalizace listingu",
    "AI popis produktu", "klíčová slova Etsy", "Etsy tagy", "handmade prodej",
    "název produktu Etsy", "cenová strategie handmade",
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${cormorant.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Strukturovaná data pro vyhledávače i AI odpovědní enginy (GEO/AEO). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getSiteJsonLd()) }}
        />
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
