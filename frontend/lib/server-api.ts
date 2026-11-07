// Serverový fetch veřejných dat (pro server komponenty). ŽÁDNÝ "use client",
// žádný token/localStorage — jen veřejné read endpointy. `no-store` = vždy
// čerstvé a route je dynamická (SSR na request, ne při buildu — backend při
// `next build` neběží).
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
