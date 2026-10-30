# Workplace audio: 500-recording preparation

The frozen candidate list is in `data/editorial/audio-workplace-500-review.json`.

It contains 500 not-yet-recorded workplace sentences, 50 per category, totaling 24,017 Dutch characters.

The recordings have **not** been generated. An AI editor has reviewed all 500 Dutch/English pairs, replaced four awkward candidates, and marked all 500 `approvedForRecording: true`. Source records were previously AI-editorially-reviewed, not verified by an independent native speaker.

Do not launch paid ElevenLabs generation or label this campaign completed until the available credit budget and the exported manifest have been checked. The existing `audio:generate` script allows at most 14,000 characters per paid run and supports resuming by ID. Split this campaign into five groups of 100 (5,004 / 4,693 / 4,868 / 4,661 / 4,791 characters).

## Implemented preparation

- Frozen review source: `data/editorial/audio-workplace-500-review.json`, with exact Dutch and English for every sentence and recording approval **off** initially.
- Export human-readable review TSVs: `npm run audio:workplace500:review`.
- The five review groups each contain 100 lines. Groups pair: changes + clarification, incidents + meetings, office + priorities, problems + remote, support + troubleshooting.
- After checking an individual `audio-export/workplace-500/review-N.tsv`, explicitly record its approval with `node scripts/approve-workplace-audio-batch.mjs N --reviewed` (N = 1, 2, 3, 4 or 5). This action changes the 100 corresponding recording-approval flags. It does not establish native-speaker certification.
- Export the **approved-only** paid-generation manifest using `npm run audio:workplace500:manifest`. It selects no items until a batch is approved; it excludes audio that has since been indexed.
- Dry-run paid generator safely: `npm run audio:generate:dry-run -- --manifest audio-export/workplace-500/manifest.json --max-clips 100 --max-characters 7000`.
- Only after checking credit balance, price and dry-run output, explicitly run `npm run audio:generate -- --manifest audio-export/workplace-500/manifest.json --max-clips 100 --max-characters 7000`. Repeating this command skips already completed, checksummed items and advances through the 500 candidates in at most 100-clip increments.
- Check/install generated clips using `npm run audio:install:dry-run`, then `npm run audio:install`. Run `node scripts/audit-recorded-audio.mjs`, the browser tests and build before a production merge.

**Current campaign status:** Five batches prepared in source control. All 500 rows are AI-approved for recording; no clips have been generated and no credits have been consumed by this PR. On the last reported ElevenLabs balance (1,756 credits), the full 24,017-character campaign is not affordable; independently confirm actual billing cost and account credits first.
