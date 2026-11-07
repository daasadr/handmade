import type { Metadata } from "next";
import { fetchPublic } from "@/lib/server-api";
import { PublicMakerCard } from "@/lib/api";
import { MakersContent } from "./makers-content";

// SSR na request (ne při buildu — backend tehdy neběží).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tvůrci",
  description:
    "Objevte handmade tvůrce a jejich ruční výrobky. Nakoupíte přímo u nich na Etsy, Amazonu nebo Fleru.",
  alternates: { canonical: "/vyrobci" },
  openGraph: {
    title: "Tvůrci — Handmade.net",
    description: "Objevte handmade tvůrce a jejich ruční výrobky.",
    url: "/vyrobci",
  },
};

export default async function Page() {
  const makers = (await fetchPublic<PublicMakerCard[]>("/public/makers")) ?? [];
  return <MakersContent makers={makers} />;
}
