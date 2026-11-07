"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, BlogPostCard } from "@/lib/api";
import { useT, useLocale } from "@/lib/i18n";
import { PublicHeader } from "@/components/public-header";
import { Card, CardContent } from "@/components/ui/card";

export default function BlogListPage() {
  const t = useT();
  const { locale } = useLocale();
  const [posts, setPosts] = useState<BlogPostCard[] | null>(null);

  useEffect(() => {
    api.blog.list().then(setPosts).catch(() => setPosts([]));
  }, []);

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
        <h1 className="font-heading text-4xl font-light heading-accent">{t("blog.title")}</h1>
        <p className="text-muted-foreground mt-3 mb-8">{t("blog.subtitle")}</p>

        {posts === null ? (
          <div className="flex items-center justify-center py-24">
            <span className="text-3xl animate-pulse">✦</span>
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed border-2" style={{ borderColor: "oklch(0.85 0.02 72)", background: "transparent" }}>
            <CardContent className="py-16 text-center">
              <p className="text-3xl mb-3">✦</p>
              <p className="font-heading text-xl font-light text-muted-foreground">{t("blog.empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`}>
                <Card className="border-0 card-mystical overflow-hidden hover:shadow-md transition-shadow" style={{ background: "oklch(0.94 0.012 75)" }}>
                  <div className="flex flex-col sm:flex-row">
                    {p.coverImageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.coverImageUrl} alt="" loading="lazy" decoding="async" className="sm:w-48 w-full h-40 sm:h-auto object-cover" />
                    )}
                    <CardContent className="py-5 flex-1">
                      <p className="font-heading text-xl font-medium leading-snug">{p.title}</p>
                      {p.excerpt && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{p.excerpt}</p>}
                      <p className="text-xs text-muted-foreground mt-3">
                        {p.publishedAt ? fmt(p.publishedAt) : ""}
                        {p.authorName ? ` · ${p.authorName}` : ""}
                      </p>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
