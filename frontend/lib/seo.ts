/**
 * Sdílené SEO/GEO/AEO konstanty a strukturovaná data.
 *
 * SEO = klasické vyhledávače, GEO/AEO = optimalizace pro AI odpovědní enginy
 * (ChatGPT, Perplexity…). Oběma pomáhá jasný, faktický obsah + strukturovaná data.
 * FAQ je zdroj pravdy jak pro viditelnou sekci na landingu, tak pro FAQPage JSON-LD —
 * musí se shodovat, jinak to Google i enginy penalizují.
 */

// Doménu lze přebít přes NEXT_PUBLIC_SITE_URL (build arg); default je produkční web.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://handmade.net";
export const SITE_NAME = "Handmade.net";

export const SITE_DESCRIPTION =
  "AI nástroj, který handmade prodejcům optimalizuje listingy — lepší název, popis, " +
  "13 klíčových slov, cenová strategie a skóre konkurenceschopnosti zvlášť pro Etsy, " +
  "Amazon Handmade a Fler. Výsledek si zkopírujete na svůj marketplace; prodáváte dál sami.";

export const SITE_TITLE =
  "Handmade.net — AI optimalizace listingů pro Etsy, Amazon a Fler";

/** FAQ — faktické, stručné odpovědi. Čeština (primární publikum). */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "Co je Handmade.net?",
    a: "Handmade.net je český AI nástroj, který handmade prodejcům optimalizuje listingy — vygeneruje lepší název, popis, klíčová slova a cenové doporučení zvlášť pro Etsy, Amazon Handmade a Fler. Výsledek si zkopírujete na svůj marketplace.",
  },
  {
    q: "Prodává Handmade.net moje výrobky?",
    a: "Ne. Handmade.net je optimalizační nástroj, ne tržiště. Prodáváte dál sami na svém účtu na Etsy, Amazonu nebo Fleru — my jen vylepšíme váš listing, aby se lépe hledal a prodával.",
  },
  {
    q: "Pro které marketplace to funguje?",
    a: "Pro Etsy, Amazon Handmade a český Fler. Pro každý generujeme výstup podle jeho pravidel: Etsy 13 tagů, Amazon odrážky a search terms, Fler česky.",
  },
  {
    q: "Je to zdarma?",
    a: "Ano, zdarma vyzkoušíte 5 optimalizací měsíčně. Placené plány Mini, Midi a Max nabízejí víc optimalizací měsíčně.",
  },
  {
    q: "Jak to funguje?",
    a: "Přidáte produkt (název, popis, cena, fotka), kliknete na Spustit analýzu a AI vygeneruje optimalizovaný název, popis, klíčová slova, cenovou strategii a skóre konkurenceschopnosti. U Etsy počítáme skóre z reálné konkurence.",
  },
  {
    q: "V jakých jazycích Handmade.net funguje?",
    a: "Rozhraní je česky i anglicky. Optimalizace umí česky i anglicky; Fler je dostupný jen v české verzi.",
  },
];

/** EN verze FAQ pro anglické zobrazení landingu (JSON-LD zůstává v CS primárním). */
export const FAQ_EN: { q: string; a: string }[] = [
  {
    q: "What is Handmade.net?",
    a: "Handmade.net is an AI tool that optimizes listings for handmade sellers — it generates a better title, description, keywords and pricing recommendation separately for Etsy, Amazon Handmade and Fler. You copy the result to your own marketplace.",
  },
  {
    q: "Does Handmade.net sell my products?",
    a: "No. Handmade.net is an optimization tool, not a marketplace. You keep selling on your own Etsy, Amazon or Fler account — we just make your listing easier to find and sell.",
  },
  {
    q: "Which marketplaces does it support?",
    a: "Etsy, Amazon Handmade and the Czech marketplace Fler. For each we generate output to its rules: Etsy 13 tags, Amazon bullet points and search terms, Fler in Czech.",
  },
  {
    q: "Is it free?",
    a: "Yes, you get 5 optimizations per month for free. Paid plans (Mini, Midi, Max) offer more per month.",
  },
  {
    q: "How does it work?",
    a: "Add a product (title, description, price, photo), click Run analysis, and the AI generates an optimized title, description, keywords, pricing strategy and a competitiveness score. For Etsy the score uses real market competition.",
  },
  {
    q: "What languages does it work in?",
    a: "The interface is in Czech and English. Optimizations work in both; Fler is available only in the Czech version.",
  },
];

/** Strukturovaná data (schema.org) jako jeden @graph pro celý web. */
export function getSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: ["cs", "en"],
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
          description: "5 optimalizací měsíčně zdarma",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
}
