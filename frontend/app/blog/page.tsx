import type { Metadata } from "next";
import { fetchPublic } from "@/lib/server-api";
import { BlogPostCard } from "@/lib/api";
import { BlogContent } from "./blog-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tipy, návody a příběhy ze světa ručních výrobků a prodeje na Etsy, Amazonu i Fleru.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Handmade.net",
    description: "Tipy, návody a příběhy ze světa ručních výrobků.",
    url: "/blog",
  },
};

export default async function Page() {
  const posts = (await fetchPublic<BlogPostCard[]>("/public/blog")) ?? [];
  return <BlogContent posts={posts} />;
}
