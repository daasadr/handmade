import type { Metadata } from "next";
import { fetchPublic } from "@/lib/server-api";
import { getServerLocale } from "@/lib/i18n-server";
import { BlogPostCard } from "@/lib/api";
import { BlogContent } from "./blog-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getServerLocale()) === "en";
  return {
    title: "Blog",
    description: en
      ? "Tips, how-tos and stories from the world of handmade and selling on Etsy, Amazon and Fler."
      : "Tipy, návody a příběhy ze světa ručních výrobků a prodeje na Etsy, Amazonu i Fleru.",
  };
}

export default async function Page() {
  const posts = (await fetchPublic<BlogPostCard[]>("/public/blog")) ?? [];
  return <BlogContent posts={posts} />;
}
