import { headers } from "next/headers";

/** Jazyk z hlavičky nastavené middlewarem (en jen pro /en/*, jinak cs). Server-only. */
export async function getServerLocale(): Promise<"cs" | "en"> {
  const h = await headers();
  return h.get("x-locale") === "en" ? "en" : "cs";
}

/** Kanonická cesta bez /en prefixu (pro hreflang/canonical). */
export async function getServerPath(): Promise<string> {
  const h = await headers();
  return h.get("x-pathname") || "/";
}
