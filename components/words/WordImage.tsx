"use client";

import { useState } from "react";
import { IMAGE_EXTENSIONS, wordAssetBase, type WordKind } from "@/lib/words/assets";

// Remembered per page load so a missing picture is only probed once.
const missing = new Set<string>();

/**
 * A word's picture, or a labelled placeholder showing exactly which file to add.
 * Tries .webp, then .png, then .jpg.
 */
export function WordImage({ kind, id, label, className = "h-32 w-32" }: { kind: WordKind; id: string; label: string; className?: string }) {
  const base = wordAssetBase(kind, id);
  const [attempt, setAttempt] = useState(() => (missing.has(base) ? IMAGE_EXTENSIONS.length : 0));

  if (attempt >= IMAGE_EXTENSIONS.length) {
    return (
      <div
        data-testid="word-image-placeholder"
        role="img"
        aria-label={`Picture of ${label} coming soon`}
        className={`${className} flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-surface p-2 text-center`}
      >
        <span aria-hidden="true" className="text-2xl">🖼️</span>
        <span className="text-[11px] leading-tight text-muted">{base.replace("/words/", "")}.webp</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- the file may not exist yet, so Next's optimiser can't be used
    <img
      src={`${base}.${IMAGE_EXTENSIONS[attempt]}`}
      alt={label}
      loading="lazy"
      className={`${className} rounded-2xl border border-border bg-white object-cover`}
      onError={() => {
        if (attempt + 1 >= IMAGE_EXTENSIONS.length) missing.add(base);
        setAttempt(attempt + 1);
      }}
    />
  );
}
