# DutchTap — Dutch recorded-audio campaign (2026-11-01)

## Scope and acceptance criteria

Only Dutch is in scope. English remains written help, and French is unchanged. Every playable Dutch utterance (base card, meaningful variation, accepted answer, similar example, topic lesson, learning task, vocabulary, noun plural, adjective form and spoken Dutch prompt) must resolve to a recorded MP3. Shared exact Dutch text should reuse one MP3. No Dutch device voice should be used on missing or broken files in the final release. Do not replace a missing recording silently: show a clear error while testing.

The read-only audit is `node scripts/audit-all-learning-audio.mjs`. At the snapshot on 2026-11-01 it found **12,393** unique Dutch targets, **1,934** with existing recordings (1,334 in the exact-text index and 600 legacy word assets), **10,459** missing, and **424,704** missing-text characters. **16** draft Dutch batches are capped at 28,000 characters and 1,000 utterances. These are source-text and estimated billing units, not proof of native-speaker review or of live audio playback.

The current draft manifests are not approved for generation. Do not invoke paid generation with `--include-unreviewed` merely to work around the guard. Editorial review must include correctness, idiomatic Belgian Dutch, punctuation and complete words; not just JSON/CI validity. Correct the underlying content before recording.

## Start with the low-cost pilot

On your machine, from the DutchTap repository:

```bash
git fetch origin
git switch --track origin/audio/full-coverage-20261101
node scripts/audit-all-learning-audio.mjs
node scripts/prepare-dutch-audio-pilot.mjs
cat audio-export/pilot-001/listen-list.txt
```

If the branch already exists locally, use `git switch audio/full-coverage-20261101 && git pull --ff-only`.

The pilot selects one AI-prechecked, exact-source sentence per grammar topic, plus word-game plural/adjective forms, skipping anything already indexed. **AI precheck is not independent native-speaker certification.** It does not make any API call.

Run a dry run first:

```bash
node scripts/generate-learning-audio.mjs \
  --manifest audio-export/pilot-001/manifest.json \
  --max-characters 2000 --max-clips 30
```

It should say `DRY RUN`. If the exact list looks right and the same Belgian Dutch voice used for the prior 500 clips remains configured in your local `.env`, run the paid pilot:

```bash
node scripts/generate-learning-audio.mjs \
  --manifest audio-export/pilot-001/manifest.json \
  --max-characters 2000 --max-clips 30 --apply
```

This uses `ELEVENLABS_VOICE_ID` and `ELEVENLABS_API_KEY` from local environment files. **Never paste the API key into chat or commit .env files.** The generator saves individual MP3s with exact-text hashes and resumes by validating checksums. It does not add them to the app automatically.

Review the resulting audio carefully for pronunciation, end clipping, speed, odd pauses and Flemish suitability. Only after listening and checking:

```bash
node scripts/install-learning-audio.mjs
node scripts/install-learning-audio.mjs --apply
node scripts/audit-recorded-audio.mjs
```

The installer checks checksums and preserves existing files. The install is local until changes are committed and deployed. Use a separate branch / PR for the new MP3s. Keep an eye on commit size as the full campaign may be several hundred MB.

## Full-batch workflow

The 16 Dutch manifests are under `audio-export/full-coverage/nl/`; `missing-nl.tsv` lists each unique utterance. Do not directly send unreviewed batch manifests to the ElevenLabs API. Inspect and correct source sentences, mark approved only the rows actually reviewed, then use `scripts/generate-learning-audio.mjs` with a verified `approvedOnly:true` manifest, a matching Belgian Dutch voice and `--max-characters 14000` (per-run safety cap). Resume the same approved manifest until it selects zero clips. The generator will refuse a paid run with more than 14,000 characters.

After each installment, validate file checksums and exact-index matching, sample-listen across categories, then update the inventory. Once recordings cover every in-scope Dutch line, remove Dutch device-TTS fallback in `lib/speech/playback.ts`, update outdated UI wording, and test real playback and broken-file handling (no silent device fallback). English and French should remain unchanged.

## Key distinctions

- The 12,393 / 10,459 counts refer to unique exact spoken targets, not every possible individual word in grammar prose.
- Some authored examples may be display-only without their own Listen buttons today; they are deliberately included to support future recorded-first UI.
- A dry run or passing unit test is **not** evidence of actual pronunciation or live playback.
- The pilot is low cost, but completing 10,459 distinct recordings may require more credits, storage, QA and elapsed time than a single evening.
