import fs from "node:fs/promises";
import path from "node:path";
import { resolveRecordingUrl } from "@/lib/speech/audio-url";

export const dynamic = "force-dynamic";

type AudioEntry = { text: string; lang: string; path: string; checksum?: string };
type LegacyCard = { dutch: string; audio?: string };

export default async function AudioPreviewPage() {
  let items: AudioEntry[] = [];
  const legacy: AudioEntry[] = [];
  let error = "";
  try {
    const dir = path.join(process.cwd(), "data");
    const raw = await fs.readFile(path.join(dir, "audio-index.json"), "utf8");
    const index = JSON.parse(raw) as { items: Record<string, AudioEntry> };
    items = Object.values(index.items).filter(item => item.lang === "nl" && item.path?.startsWith("/audio/utterances/"));
    const originalFiles = ["flashcards.json", "flashcard-additions.json", "flashcard-additions-2.json"];
    for (const file of originalFiles) {
      const cards = JSON.parse(await fs.readFile(path.join(dir, file), "utf8")) as LegacyCard[];
      legacy.push(...cards.filter(card => card.audio?.startsWith("/audio/flashcards/"))
        .map(card => ({ text: card.dutch, lang: "nl", path: card.audio! })));
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const baseConfigured = !!process.env.NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL;
  const legacyR2 = baseConfigured && process.env.NEXT_PUBLIC_DUTCH_AUDIO_LEGACY_R2 === "true";
  return (
    <main style={{ maxWidth: 900, margin: "2rem auto", padding: "1rem", fontFamily: "system-ui" }}>
      <h1>DutchTap — recorded audio preview</h1>
      <p>Indexed Dutch MP3s: {items.length}. Original base flashcard MP3s: {legacy.length}.</p>
      <p>Indexed audio source: <strong>{baseConfigured ? "Cloudflare R2" : "Local/Vercel"}</strong>. Original flashcard audio source: <strong>{legacyR2 ? "Cloudflare R2" : "Local/Vercel"}</strong>.</p>
      <p>This page tests file playback; it does not replace existing Listen buttons or verify every file over HTTP.</p>
      {error && <p role="alert">Cannot load audio inventory: {error}</p>}
      {!items.length && <p>No indexed clips installed yet.</p>}
      <h2>Original Dutch flashcards — first 15 of {legacy.length}</h2>
      <ol>{legacy.slice(0, 15).map(item => <li key={item.path} style={{ marginBottom: "1.25rem" }}>
        <div lang="nl" style={{ marginBottom: "0.4rem" }}>{item.text}</div>
        <audio controls preload="none" src={resolveRecordingUrl(item.path)} aria-label={`Play original flashcard: ${item.text}`} />
      </li>)}</ol>
      <h2>Indexed Dutch recordings — first 80 of {items.length}</h2>
      <ol>{items.slice(0, 80).map(item => <li key={item.path} style={{ marginBottom: "1.25rem" }}>
        <div lang="nl" style={{ marginBottom: "0.4rem" }}>{item.text}</div>
        <audio controls preload="none" src={resolveRecordingUrl(item.path)} aria-label={`Play indexed clip: ${item.text}`} />
      </li>)}</ol>
    </main>
  );
}
