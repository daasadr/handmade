import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublic } from "@/lib/server-api";
import { PublicMaker } from "@/lib/api";
import { MakerContent } from "./maker-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const maker = await fetchPublic<PublicMaker>(`/public/makers/${id}`);
  if (!maker) return { title: "Tvůrce" };
  const desc = (maker.motto || maker.bio || `Ruční výrobky od ${maker.brandName}.`).slice(0, 200);
  return {
    title: maker.brandName,
    description: desc.slice(0, 160),
    openGraph: {
      title: `${maker.brandName} — Handmade.net`,
      description: desc,
      images: maker.profileImageUrl ? [maker.profileImageUrl] : undefined,
      url: `/vyrobci/${id}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const maker = await fetchPublic<PublicMaker>(`/public/makers/${id}`);
  if (!maker) notFound();
  return <MakerContent maker={maker} />;
}
