"use client";

import Link from "next/link";
import DOMPurify from "dompurify";
import { BlogPost } from "@/lib/api";
import { useT, useLocale } from "@/lib/i18n";
import { PublicHeader } from "@/components/public-header";

/** Vizuální část článku — data ze server komponenty (SSR). */
export function PostContent({ post }: { post: BlogPost }) {
  const t = useT();
  const { locale } = useLocale();

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(locale === "en" ? "en-US" : "cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.973 0.008 80)" }}>
      <PublicHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
          {t("blog.back")}
        </Link>
        <article className="mt-5">
          <h1 className="font-heading text-4xl font-light leading-tight">{post.title}</h1>
          <p className="text-sm text-muted-foreground mt-3 mb-6">
            {post.publishedAt ? fmt(post.publishedAt) : ""}
            {post.authorName ? ` · ${post.authorName}` : ""}
          </p>
          {post.coverImageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={post.coverImageUrl} alt="" decoding="async" className="w-full rounded-xl object-cover mb-6" style={{ maxHeight: "440px" }} />
          )}
          <div
            className="prose-story text-base text-foreground/85"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.contentHtml) }}
          />
        </article>
      </main>
    </div>
  );
}
