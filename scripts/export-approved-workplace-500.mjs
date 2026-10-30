// Offline only. Builds a generator-compatible manifest from explicitly approved rows.
// This script never calls ElevenLabs or changes the reviewed source list.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const plan = read("data/editorial/audio-workplace-500-review.json");
const cards = new Map(read("data/workplace-cards.json").map((c) => [c.id, c]));
const existing = new Set(Object.values(read("data/audio-index.json").items).map((r) => r.text));
if (plan.rows.length !== 500) throw Error("Expected exactly 500 reviewed candidates.");
const batches = [];
let selected = 0, characters = 0, approved = 0;
for (let start = 0; start < 500; start += 100) {
  const items = [];
  for (const row of plan.rows.slice(start, start + 100)) {
    const source = cards.get(row.cardId);
    if (!source || row.dutch !== source.dutch || row.english !== source.english)
      throw Error("Source sentence changed: " + row.cardId);
    if (source.review?.status !== "ai-editorially-reviewed")
      throw Error("Unexpected editorial provenance: " + row.cardId);
    if (!row.approvedForRecording) continue;
    approved++;
    if (existing.has(row.dutch)) continue;
    const id = createHash("sha256").update("nl\0" + row.dutch).digest("hex").slice(0, 24);
    items.push({ id, lang: "nl", text: row.dutch, roles: ["card:" + row.cardId], approved: true, existingAudio: "" });
    selected++;
    characters += row.dutch.length;
  }
  if (items.length) batches.push({id:"nl-workplace-500-"+(start/100+1),items});
}
const dir = path.join(root,"audio-export/workplace-500");
fs.mkdirSync(dir,{recursive:true});
const manifest = {version:1, language:"nl", approvedOnly:true, pauseSeconds:0,
 createdAt:new Date().toISOString(), inventory:500, existing:approved-selected,
 unreviewed:500-approved, batches};
fs.writeFileSync(path.join(dir,"manifest.json"), JSON.stringify(manifest,null,2)+"\n");
console.log(JSON.stringify({candidates:500, approved, pending:500-approved, readyToRecord:selected, characters, batches:batches.length},null,2));
