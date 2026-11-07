import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublic } from "@/lib/server-api";
import { BlogPost } from "@/lib/api";
import { PostContent } from "./post-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublic<BlogPost>(`/public/blog/${slug}`);
  if (!post) return { title: "Článek" };
  const desc = (post.excerpt || post.title).slice(0, 200);
  return {
    title: post.title,
    description: desc.slice(0, 160),
    openGraph: {
      type: "article",
      title: `${post.title} — Handmade.net`,
      description: desc,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      url: `/blog/${slug}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPublic<BlogPost>(`/public/blog/${slug}`);
  if (!post) notFound();
  return <PostContent post={post} />;
}
