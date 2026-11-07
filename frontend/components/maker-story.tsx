"use client";

import DOMPurify from "dompurify";
import { buildStoryBlocks } from "@/lib/story-template";

/**
 * Zobrazení příběhu tvůrce — sdílené mezi vlastním profilem a veřejnou výlohou.
 * Custom režim = sanitizované HTML (DOMPurify, 2. obrana; server čistí při uložení),
 * jinak složené odstavce + obrázky ze šablony, jinak krátké bio.
 */
export function MakerStory({
  storyMode,
  storyHtml,
  storyAnswers,
  storyImages,
  bio,
}: {
  storyMode?: "template" | "custom" | null;
  storyHtml?: string | null;
  storyAnswers?: Record<string, string>;
  storyImages?: Record<string, string>;
  bio?: string | null;
}) {
  if (storyMode === "custom" && storyHtml) {
    return (
      <div
        className="prose-story text-sm text-foreground/80"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(storyHtml) }}
      />
    );
  }

  const blocks = buildStoryBlocks(storyAnswers, storyImages);
  if (blocks.length > 0) {
    return (
      <div className="space-y-4">
        {blocks.map((b) => (
          <div key={b.key} className="space-y-2">
            {b.text && (
              <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{b.text}</p>
            )}
            {b.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={b.image} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: "420px" }} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return bio ? (
    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{bio}</p>
  ) : null;
}
