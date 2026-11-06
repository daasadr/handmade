"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { TextAlign } from "@tiptap/extension-text-align";
import { Image } from "@tiptap/extension-image";
import { toast } from "sonner";
import {
  Bold, Italic, Underline, Strikethrough, Heading2, Heading3,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, ImagePlus,
} from "lucide-react";
import { api } from "@/lib/api";
import { compressImage, ImageUploadError } from "@/lib/image-upload";
import { useT } from "@/lib/i18n";

// Pár fontů vhodných pro ručně dělané příběhy. Hodnota je CSS font-family.
const FONTS: { label: string; value: string }[] = [
  { label: "Výchozí", value: "" },
  { label: "Ozdobné", value: "'Cormorant Garamond', serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Sans", value: "'DM Sans', system-ui, sans-serif" },
  { label: "Psací", value: "'Comic Sans MS', cursive" },
];

// Barvy z palety webu + pár doplňkových.
const COLORS = ["#2a1f18", "#00A86B", "#00979c", "#b5651d", "#8b2f8b", "#c0392b"];

function Btn({
  active, onClick, title, children,
}: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-black/5"
      style={active ? { background: "oklch(0.78 0.11 196 / 0.25)", color: "oklch(0.35 0.08 200)" } : undefined}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const t = useT();

  const insertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      const { url } = await api.makers.uploadStoryImage(compressed);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err: unknown) {
      if (err instanceof ImageUploadError) toast.error(err.fullMessage);
      else toast.error(err instanceof Error ? err.message : t("err.uploadFailed"));
    }
  };

  const divider = <span className="w-px h-6 bg-black/10 mx-0.5" />;

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 p-1.5 rounded-t-lg border-b"
      style={{ background: "oklch(0.97 0.008 80)", borderColor: "oklch(0.85 0.02 72)" }}
    >
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title={t("ed.bold")}><Bold className="h-4 w-4" /></Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title={t("ed.italic")}><Italic className="h-4 w-4" /></Btn>
      <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title={t("ed.underline")}><Underline className="h-4 w-4" /></Btn>
      <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title={t("ed.strike")}><Strikethrough className="h-4 w-4" /></Btn>
      {divider}
      <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title={t("ed.h2")}><Heading2 className="h-4 w-4" /></Btn>
      <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title={t("ed.h3")}><Heading3 className="h-4 w-4" /></Btn>
      <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title={t("ed.bullets")}><List className="h-4 w-4" /></Btn>
      <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title={t("ed.numbers")}><ListOrdered className="h-4 w-4" /></Btn>
      {divider}
      <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title={t("ed.alignLeft")}><AlignLeft className="h-4 w-4" /></Btn>
      <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title={t("ed.alignCenter")}><AlignCenter className="h-4 w-4" /></Btn>
      <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title={t("ed.alignRight")}><AlignRight className="h-4 w-4" /></Btn>
      {divider}
      {/* Barvy */}
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => editor.chain().focus().setColor(c).run()}
          title={t("ed.color")}
          aria-label={`${t("ed.color")} ${c}`}
          className="h-5 w-5 rounded-full border border-black/15"
          style={{ background: c }}
        />
      ))}
      {divider}
      {/* Font */}
      <select
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontFamily(v).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
        title={t("ed.font")}
        className="h-8 text-xs rounded-md border px-1 bg-transparent"
        style={{ borderColor: "oklch(0.85 0.02 72)" }}
        defaultValue=""
      >
        {FONTS.map((f) => (
          <option key={f.label} value={f.value}>{f.label}</option>
        ))}
      </select>
      {divider}
      {/* Obrázek */}
      <label className="h-8 w-8 flex items-center justify-center rounded-md cursor-pointer transition-colors hover:bg-black/5" title={t("ed.image")}>
        <ImagePlus className="h-4 w-4" />
        <input type="file" accept="image/*" className="hidden" onChange={insertImage} />
      </label>
    </div>
  );
}

export default function StoryEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // nutné v Next (SSR) — jinak hydration mismatch
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose-story min-h-[220px] px-3 py-3 outline-none" },
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-lg border" style={{ borderColor: "oklch(0.85 0.02 72)" }}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
