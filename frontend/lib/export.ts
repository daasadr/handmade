import { Product, AiOptimization, Platform, PLATFORM_LABELS } from "./api";

/**
 * Export optimalizovaného obsahu ke stažení — ať výrobce nemusí nic přepisovat
 * ručně. Vše client-side (data už máme načtená), žádné volání backendu.
 *
 * - CSV: tabulka produkt × platforma se všemi poli (pro přehled / nástroje na
 *   hromadný upload). UTF-8 s BOM + CRLF, ať Excel správně otevře diakritiku.
 * - .txt: copy-ready blok na míru jedné platformě (hotový k vložení na listing).
 */

function escapeCsv(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function slugify(s: string): string {
  const base = (s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 40);
  return base || "export";
}

function platformLabel(p?: string): string {
  return PLATFORM_LABELS[p as Platform] ?? p ?? "";
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const CSV_HEADERS = [
  "Produkt", "Platforma", "Optimalizovaný název", "Popis", "Klíčová slova / tagy",
  "Materiály", "Odrážky (Amazon)", "Search terms (Amazon)", "Cenové doporučení", "Skóre",
];

function optRow(productTitle: string, o: AiOptimization): string[] {
  const pf = o.platformFields ?? {};
  return [
    productTitle,
    platformLabel(o.platform),
    o.titleOptimized ?? "",
    o.descriptionOptimized ?? "",
    (o.keywords ?? []).join(", "),
    (pf.materials ?? []).join(", "),
    (pf.bulletPoints ?? []).join(" | "),
    pf.searchTerms ?? "",
    o.pricingRecommendation ?? "",
    o.competitivenessScore != null ? String(o.competitivenessScore) : "",
  ];
}

/** True, pokud je vůbec co exportovat. */
export function hasExportable(products: Product[]): boolean {
  return products.some((p) => (p.optimizations ?? []).length > 0);
}

function buildCsv(products: Product[]): string {
  const rows: string[][] = [CSV_HEADERS];
  for (const p of products) {
    for (const o of p.optimizations ?? []) rows.push(optRow(p.titleOriginal, o));
  }
  return "﻿" + rows.map((r) => r.map(escapeCsv).join(",")).join("\r\n");
}

export function exportAllCsv(products: Product[]) {
  downloadFile("handmade-export.csv", buildCsv(products), "text/csv;charset=utf-8");
}

export function exportProductCsv(product: Product) {
  downloadFile(`${slugify(product.titleOriginal)}.csv`, buildCsv([product]), "text/csv;charset=utf-8");
}

/** Copy-ready textový blok jedné optimalizace, s popisky sekcí. */
export function buildPlatformText(productTitle: string, o: AiOptimization): string {
  const pf = o.platformFields ?? {};
  const parts: string[] = [`${platformLabel(o.platform)} — ${productTitle}`, ""];
  parts.push("NÁZEV:", o.titleOptimized ?? "", "");
  parts.push("POPIS:", o.descriptionOptimized ?? "", "");
  if (o.keywords?.length) parts.push("KLÍČOVÁ SLOVA / TAGY:", o.keywords.join(", "), "");
  if (pf.materials?.length) parts.push("MATERIÁLY:", pf.materials.join(", "), "");
  if (pf.bulletPoints?.length)
    parts.push("ODRÁŽKY:", pf.bulletPoints.map((b) => `• ${b}`).join("\n"), "");
  if (pf.searchTerms) parts.push("SEARCH TERMS:", pf.searchTerms, "");
  if (o.pricingRecommendation) parts.push("CENOVÉ DOPORUČENÍ:", o.pricingRecommendation, "");
  return parts.join("\n").trim() + "\n";
}

export function exportPlatformTxt(productTitle: string, o: AiOptimization) {
  const name = `${slugify(productTitle)}-${o.platform ?? "listing"}.txt`;
  downloadFile(name, buildPlatformText(productTitle, o), "text/plain;charset=utf-8");
}

/**
 * Amazon Handmade „flat-file" export.
 *
 * PROČ zvlášť od obecného CSV: Amazon nemá jeden univerzální import — používá
 * kategoriové Inventory File šablony stažené ze Seller Centralu, s PEVNÝMI názvy
 * sloupců (item_name, bullet_point1-5, generic_keywords, standard_price…) a třemi
 * řádky hlavičky. Ty šablony jsou obří, kategoriové a mění se, takže je nelze
 * spolehlivě replikovat na klientu. Proto exportujeme data pod Amazon názvy
 * sloupců — výrobce je vloží do oficiální šablony (copy sloupců), ne naopak.
 *
 * ⚠️ Etsy sem nepatří: Etsy žádný CSV/flat-file import listingů NEMÁ. Tahle
 * funkce je čistě pro platform === "amazon".
 */
const AMAZON_HEADERS = [
  "item_sku",
  "item_name",
  "brand_name",
  "product_description",
  "bullet_point1",
  "bullet_point2",
  "bullet_point3",
  "bullet_point4",
  "bullet_point5",
  "generic_keywords",
  "standard_price",
  "quantity",
];

function amazonRow(product: Product, o: AiOptimization, brandName: string): string[] {
  const pf = o.platformFields ?? {};
  const bullets = pf.bulletPoints ?? [];
  // generic_keywords = skryté vyhledávací termíny; když Amazon pole chybí,
  // použij tagy. Amazon limit ~249 bajtů, raději ořízni.
  const keywords = (pf.searchTerms || (o.keywords ?? []).join(" ")).slice(0, 240);
  const price = product.priceOriginal != null ? String(product.priceOriginal) : "";
  return [
    slugify(product.titleOriginal), // item_sku — stabilní SKU z názvu
    (o.titleOptimized ?? "").slice(0, 200), // Amazon item_name limit 200 znaků
    brandName,
    o.descriptionOptimized ?? "",
    bullets[0] ?? "",
    bullets[1] ?? "",
    bullets[2] ?? "",
    bullets[3] ?? "",
    bullets[4] ?? "",
    keywords,
    price,
    "1", // quantity — výchozí; výrobce upraví v šabloně
  ];
}

export function exportAmazonCsv(product: Product, o: AiOptimization, brandName = "") {
  const rows = [AMAZON_HEADERS, amazonRow(product, o, brandName)];
  const csv = "﻿" + rows.map((r) => r.map(escapeCsv).join(",")).join("\r\n");
  downloadFile(`${slugify(product.titleOriginal)}-amazon.csv`, csv, "text/csv;charset=utf-8");
}
