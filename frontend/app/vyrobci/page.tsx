import type { Metadata } from "next";
import { fetchPublic } from "@/lib/server-api";
import { getServerLocale } from "@/lib/i18n-server";
import { PublicMakerCard } from "@/lib/api";
import { MakersContent } from "./makers-content";

// SSR na request (ne při buildu — backend tehdy neběží).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getServerLocale()) === "en";
  // canonical + hreflang řeší root layout; tady jen jazyk titulku/popisu.
  return {
    title: en ? "Makers" : "Tvůrci",
    description: en
      ? "Discover handmade makers and their work. Buy directly from them on Etsy, Amazon or Fler."
      : "Objevte handmade tvůrce a jejich ruční výrobky. Nakoupíte přímo u nich na Etsy, Amazonu nebo Fleru.",
  };
}

export default async function Page() {
  const makers = (await fetchPublic<PublicMakerCard[]>("/public/makers")) ?? [];
  return <MakersContent makers={makers} />;
}
