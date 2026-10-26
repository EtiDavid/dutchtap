#!/usr/bin/env node
/**
 * Explicit, fail-closed Grammar Mastery RELEASE gate.
 * This is intentionally separate from development tests: partial feature branches
 * must continue to run CI while the approved acceptance matrix remains incomplete.
 *
 * Only an independent reviewer may set an acceptance row to VERIFIED after
 * recording concrete proof in docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md.
 * Counts are structural signals, never a substitute for pedagogical sign-off.
 */
import { readFileSync } from "node:fs";
const doc = readFileSync(new URL("../docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md", import.meta.url), "utf8");
const rows = [...doc.matchAll(/^\|\s*\*\*(A\d{2})\*\*[^|]*\|\s*\*\*(VERIFIED|PARTIAL|BLOCKED)[^*]*\*\*\s*\|/gm)];
const statuses = new Map(rows.map((m) => [m[1], m[2]]));
const invalid = [];
for (let i = 1; i <= 25; i++) {
  const id = `A${String(i).padStart(2, "0")}`;
  const status = statuses.get(id);
  if (status !== "VERIFIED") invalid.push(`${id}: ${status ?? "missing acceptance row"}`);
}
if (rows.length !== 25) invalid.push(`Expected 25 acceptance rows; found ${rows.length}`);
const releaseStates = /PARTIALLY COMPLETE|NOT MERGE\/RELEASE APPROVED|P7 — independent audit and release: BLOCKED/i;
if (releaseStates.test(doc)) invalid.push("Release note still explicitly declares partial/unapproved state");
if (invalid.length) {
  console.error("GRAMMAR MASTERY RELEASE BLOCKED: acceptance is not complete.");
  for (const item of invalid) console.error(" - " + item);
  console.error("Do not tag or merge as complete until every proof-backed A01–A25 item is verified.");
  process.exitCode = 1;
} else {
  console.log("All 25 matrix statuses read VERIFIED; reviewer must still confirm evidence, CI and deployment rules.");
}
