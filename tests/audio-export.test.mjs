import { describe, expect, it } from "vitest";
import {
  batches,
  inventory,
  audioId,
} from "../scripts/export-learning-audio.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

describe("recording transcript pipeline", () => {
  it("deduplicates exact utterances and separates language and role", () => {
    const items = inventory();
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    expect(audioId("test", "nl")).not.toBe(audioId("test", "en"));
    expect(
      items.find(
        (i) => i.text === "Zij vindt het leuk om voor haar vrienden te koken.",
      )?.approved,
    ).toBe(true);
    expect(
      items.some((i) => i.roles.some((r) => r.startsWith("game-noun:"))),
    ).toBe(true);
    expect(
      items.some(
        (i) => i.lang === "en" && i.roles.includes("reviewed-scenario"),
      ),
    ).toBe(true);
  });
  it("caps both utterance count and character count without losing order", () => {
    const items = Array.from({ length: 121 }, (_, i) => ({
      text: "x".repeat(100),
      id: String(i),
    }));
    const groups = batches(items, 50, 1500);
    expect(groups.flat()).toEqual(items);
    expect(
      groups.every(
        (g) =>
          g.length <= 50 && g.reduce((n, x) => n + x.text.length, 0) <= 1500,
      ),
    ).toBe(true);
    expect(() => batches(items, 101)).toThrow();
  });
  it("inspects real audio boundaries and refuses an ambiguous pause count or altered transcript", () => {
    if (spawnSync("ffmpeg", ["-version"]).error) return; // local environments may not have the optional import tool
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "dutchtap-audio-test-"));
    try {
      const audio = path.join(temp, "synthetic.wav");
      execFileSync("ffmpeg", [
        "-nostdin",
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=0.5",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=44100:cl=mono:d=3",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=660:duration=0.5",
        "-filter_complex",
        "[0:a][1:a][2:a]concat=n=3:v=0:a=1[a]",
        "-map",
        "[a]",
        audio,
      ]);
      const manifest = path.join(temp, "manifest.json");
      const items = ["Eerste zin.", "Tweede zin."].map((text) => ({
        id: audioId(text),
        lang: "nl",
        text,
      }));
      const write = (rows) =>
        fs.writeFileSync(
          manifest,
          JSON.stringify({
            approvedOnly: true,
            language: "nl",
            batches: [{ id: "test", items: rows }],
          }),
        );
      const run = () =>
        spawnSync(
          "python3",
          [
            "scripts/import-learning-audio.py",
            "--manifest",
            manifest,
            "--batch",
            "test",
            "--audio",
            audio,
          ],
          { encoding: "utf8" },
        );
      write(items);
      expect(run().stdout).toContain("DRY RUN");
      expect(run().status).toBe(0);
      fs.mkdirSync(path.join(temp,'data'));
      fs.writeFileSync(path.join(temp,'data/audio-index.json'),JSON.stringify({version:1,items:{}}));
      const install=()=>spawnSync('python3',['-c',
        "import runpy,sys,pathlib; m=runpy.run_path(sys.argv[1]); m['main'].__globals__['ROOT']=pathlib.Path(sys.argv[2]); sys.argv=[sys.argv[1],'--manifest',sys.argv[3],'--batch','test','--audio',sys.argv[4],'--apply']; m['main']()",
        path.resolve('scripts/import-learning-audio.py'),temp,manifest,audio],{encoding:'utf8'});
      expect(install().status).toBe(0);
      const index=JSON.parse(fs.readFileSync(path.join(temp,'data/audio-index.json'),'utf8'));
      expect(Object.keys(index.items)).toHaveLength(2);
      for(const item of Object.values(index.items))expect(fs.statSync(path.join(temp,'public',item.path)).size).toBeGreaterThan(100);
      expect(install().stderr).toContain('refusing to overwrite');
      write([
        ...items,
        { id: audioId("Derde zin."), lang: "nl", text: "Derde zin." },
      ]);
      expect(run().status).not.toBe(0);
      expect(run().stderr).toContain("expected 2");
      write([{ ...items[0], text: "Changed." }, items[1]]);
      expect(run().stderr).toContain(
        "Manifest text, language or ID was modified",
      );
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });
});
