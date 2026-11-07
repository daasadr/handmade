"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { toast } from "sonner";
import { api, BlogPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { compressImage, ImageUploadError } from "@/lib/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StoryEditor = dynamic(() => import("@/components/story-editor"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border py-16 text-center text-sm text-muted-foreground" style={{ borderColor: "oklch(0.85 0.02 72)" }}>
      <span className="animate-pulse">✦</span>
    </div>
  ),
});

type Draft = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImageUrl: string;
  authorName: string;
  published: boolean;
};

const BLANK: Draft = {
  id: "", title: "", slug: "", excerpt: "", contentHtml: "",
  coverImageUrl: "", authorName: "", published: false,
};

export default function AdminBlogPage() {
  const { user } = useAuth();
  const t = useT();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<Draft>(BLANK);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const reload = () => api.adminBlog.list().then(setPosts).catch(() => {});
  useEffect(() => { reload(); }, []);

  if (user && user.role !== "admin") {
    return <p className="text-muted-foreground py-20 text-center">{t("blog.adminOnly")}</p>;
  }

  const edit = (p: BlogPost) =>
    setForm({
      id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt ?? "",
      contentHtml: p.contentHtml, coverImageUrl: p.coverImageUrl ?? "",
      authorName: p.authorName ?? "", published: p.published,
    });

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    try {
      const compressed = await compressImage(file);
      const { url } = await api.makers.uploadStoryImage(compressed);
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (err: unknown) {
      if (err instanceof ImageUploadError) toast.error(err.fullMessage);
      else toast.error(err instanceof Error ? err.message : t("err.uploadFailed"));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error(t("blog.titleRequired")); return; }
    if (!form.contentHtml.trim()) { toast.error(t("blog.contentRequired")); return; }
    setSaving(true);
    try {
      const data = {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt || undefined,
        contentHtml: form.contentHtml,
        coverImageUrl: form.coverImageUrl || undefined,
        authorName: form.authorName || undefined,
        published: form.published,
      };
      if (form.id) await api.adminBlog.update(form.id, data);
      else await api.adminBlog.create(data);
      toast.success(t("blog.saved"));
      setForm(BLANK);
      reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("err.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("blog.deleteConfirm"))) return;
    try {
      await api.adminBlog.remove(id);
      if (form.id === id) setForm(BLANK);
      reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("err.saveFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-4xl font-light heading-accent">{t("blog.adminTitle")}</h1>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Admin</Link>
      </div>

      {/* Editor */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal">
            {form.id ? t("blog.editing") : t("blog.newPost")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="b-title">{t("blog.fTitle")}</Label>
            <Input id="b-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="b-slug">{t("blog.fSlug")}</Label>
              <Input id="b-slug" placeholder={t("blog.fSlugPlaceholder")} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-author">{t("blog.fAuthor")}</Label>
              <Input id="b-author" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-excerpt">{t("blog.fExcerpt")}</Label>
            <Textarea id="b-excerpt" rows={2} className="resize-none" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("blog.fCover")}</Label>
            <div className="flex items-center gap-3">
              {form.coverImageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={form.coverImageUrl} alt="" className="h-16 rounded-lg object-cover border" style={{ borderColor: "oklch(0.85 0.02 72)" }} />
              )}
              <label className="text-xs cursor-pointer hover:underline" style={{ color: "oklch(0.40 0.10 196)" }}>
                {uploadingCover ? t("prod.uploading") : form.coverImageUrl ? t("blog.fCoverChange") : t("blog.fCoverAdd")}
                <input type="file" accept="image/*" className="hidden" onChange={handleCover} disabled={uploadingCover} />
              </label>
              {form.coverImageUrl && (
                <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => setForm({ ...form, coverImageUrl: "" })}>
                  {t("pe.removeImage")}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("blog.fContent")}</Label>
            <StoryEditor value={form.contentHtml} onChange={(html) => setForm((f) => ({ ...f, contentHtml: html }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4" />
            <span className="text-sm font-medium">{t("blog.fPublished")}</span>
          </label>
          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("new.submitting") : t("pe.save")}
            </Button>
            {form.id && (
              <Button variant="outline" onClick={() => setForm(BLANK)}>{t("blog.newPost")}</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seznam */}
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-light">{t("blog.allPosts")}</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("blog.noneYet")}</p>
        ) : (
          posts.map((p) => (
            <Card key={p.id} className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
              <CardContent className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /{p.slug} · {p.published ? t("blog.published") : t("blog.draft")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => edit(p)}>{t("profile.edit")}</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                    {t("blog.delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
