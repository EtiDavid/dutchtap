import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

type AudioEntry = { text: string; lang: string; path: string; checksum?: string };

export default async function AudioPreviewPage() {
  let items: AudioEntry[] = [];
  let error = "";
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data/audio-index.json"), "utf8");
    const index = JSON.parse(raw) as { items: Record<string, AudioEntry> };
    items = Object.values(index.items).filter((item) => item.lang === "nl" && item.path?.startsWith("/audio/"));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return (
    <main style={{ maxWidth: 900, margin: "2rem auto", padding: "1rem", fontFamily: "system-ui" }}>
      <h1>DutchTap — local audio preview</h1>
      <p>Installed Dutch clips: {items.length}. This page tests file playback; it does not replace existing audio buttons.</p>
      {error && <p role="alert">Cannot read audio index: {error}</p>}
      {!items.length && <p>No installed clips yet. Run the installer with --apply after checking its dry run.</p>}
      <ol>
        {items.slice(0, 200).map((item) => (
          <li key={item.path} style={{ marginBottom: "1.25rem" }}>
            <div lang="nl" style={{ marginBottom: "0.4rem" }}>{item.text}</div>
            <audio controls preload="none" src={item.path} aria-label={`Play: ${item.text}`} />
          </li>
        ))}
      </ol>
      {items.length > 200 && <p>Showing the first 200 clips.</p>}
    </main>
  );
}
