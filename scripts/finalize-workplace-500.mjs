// Finalise 500 already-generated recordings. NO ElevenLabs API calls.
// Usage: npm run audio:workplace500:finalize -- --push
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
const sha = (data) => createHash("sha256").update(data).digest("hex");
const push = process.argv.includes("--push");
const run = (bin, args) => {
  console.log("> " + bin + " " + args.join(" "));
  const result = spawnSync(bin, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(bin + " failed (" + result.status + "); audio files are preserved.");
};
const gitText = (args) => execFileSync("git", args, {cwd:root,encoding:"utf8"});
const list = read("data/editorial/audio-workplace-500-review.json").rows;
const current = read("data/audio-index.json").items;
const baseline = JSON.parse(gitText(["show", "HEAD:data/audio-index.json"])).items;
const stateFile = fs.readFileSync(path.join(root, "audio-generated/generation-state.json"), "utf8").trimEnd();
const state = JSON.parse(stateFile.endsWith("\\n") ? stateFile.slice(0, -2) : stateFile).clips;
if (gitText(["branch","--show-current"]).trim() !== "audio/workplace-500-20261030")
  throw Error("Checkout audio/workplace-500-20261030 before finalising.");
if (list.length !== 500 || list.some(x => !x.approvedForRecording)) throw Error("Recording campaign not approved.");
for (const [id, item] of Object.entries(baseline))
  if (JSON.stringify(current[id]) !== JSON.stringify(item))
    throw Error("Baseline indexed recording changed: " + id);
const expectedIDs = new Set();
const names = [];
for (const row of list) {
  const id = sha("nl\0" + row.dutch).slice(0,24);
  expectedIDs.add(id);
  const item = current[id], saved = state[id];
  if (!item || item.text !== row.dutch || item.lang !== "nl" ||
      item.path !== "/audio/utterances/" + id + ".mp3") throw Error("Missing or incorrect indexed audio: " + row.cardId);
  if (!saved || saved.text !== row.dutch || saved.voice !== "9kBSa5emtWArU7U0792v" ||
      saved.model !== "eleven_multilingual_v2" || saved.approved !== true)
    throw Error("Missing Diederik source evidence for " + row.cardId);
  const relative = "public" + item.path;
  const bytes = fs.readFileSync(path.join(root, relative));
  if (bytes.length < 100 || sha(bytes) !== item.checksum || sha(bytes) !== saved.checksum)
    throw Error("MP3 checksum mismatch: " + row.cardId);
  names.push(relative);
}
const additions = Object.keys(current).filter(id => !baseline[id]);
if (additions.length !== 500 || additions.some(id => !expectedIDs.has(id)))
  throw Error("Audio index additions must be exactly these 500 reviewed clips.");
const modified = gitText(["status","--porcelain=v1","--untracked-files=all"]).trimEnd().split("\n").filter(Boolean);
for (const line of modified) {
  const file = line.slice(3);
  if (file !== "data/audio-index.json" && !names.includes(file))
    throw Error("Unrelated working tree modification; stop before commit: " + line);
}
console.log("Verified: 500 Diederik recordings, approved texts, preserved old index and matching checksums.");
run("node", ["scripts/audit-recorded-audio.mjs"]);
run("npm", ["test"]);
run("npm", ["run","build"]);
run("npm", ["run","test:flashcards"]);
run("npm", ["run","test:prod"]);
console.log("All verification suites passed.");
if (push) {
  run("git", ["add","--", "data/audio-index.json",...names]);
  run("git", ["commit","-m","Install 500 reviewed Flemish workplace recordings"]);
  run("git", ["push","origin","HEAD:audio/workplace-500-20261030"]);
  console.log("500 recordings pushed to draft PR #28. No merge or production deployment performed.");
}
