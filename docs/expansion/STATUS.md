# Sentence expansion status

Target: **300 sentences = the original 50 + exactly 250 reviewed additions**.

The deck contains all 300 sentences. The original 50 IDs, card fields, pictures,
MP3 files and v2 progress keys remain unchanged; `baseline.json` records their
hashes and preservation tests enforce them. The 250 additions use 100 displayed
sentences from the user-approved replacement for video 1 and 150 from video 2.

## Source record

- The originally requested video 1 URL is retained in `sources.json` as
  superseded provenance. The user supplied and approved
  `Learn Dutch Speak Any Time 300 Key Past, Present & Future Phrases` as its
  replacement.
- The supplied `Study Dutch Essential Sentences 300 Common Patterns to Speak
  Dutch` file matches the requested video 2.
- Dutch and English text were transcribed from the videos' displayed text, then
  normalized, deduplicated and reviewed. `content-review.json` retains source
  timestamps, raw displayed text, corrected translations and review notes.

This is a careful Codex language review, not a claim of native-speaker sign-off.
The reviewed forms `ik hou` and `half zes` follow Team Taaladvies guidance, and
valid `hebt/heeft u` and `kan/kunt u` alternatives are accepted in quiz answers.

## Assets

- `illustration-prompts.json` contains one scene-specific prompt for every new
  card. All 250 unique illustrations have been visually reviewed and installed
  as individual WebP files at `public/illustrations/cards/<card-id>.webp`.
- Ten ordered UTF-8 recording batches contain 25 Dutch sentences each, separated
  by blank lines. They contain no IDs, English, numbering or instructions.
- `audio/manifest.json` maps each recording position to its card ID and final
  `public/audio/flashcards/<card-id>.mp3` path.
- All ten Diederik recordings were aligned to their ordered batches, split into
  250 card-ID MP3 files, boundary-checked, decoded and installed. The source
  hashes, timings, recognized Dutch and clip hashes are retained in
  `audio/installation-report.json`.

The installation combined Dutch speech recognition with the approved text order,
then moved each boundary to the quietest nearby 80 ms window. All 250 recognized
sentences aligned in order, every boundary measured below -48 dB, and every final
clip decoded successfully. Recognition is an alignment check rather than a claim
of native-speaker pronunciation review.

## Product changes

- Skip without rating works before and after reveal, stops playback and advances
  without changing progress.
- The quiz uses reviewed fill-the-blank targets for 93 additions and explicit
  word-order practice for the other 157. Alternative correct Dutch forms are not
  presented as wrong answers.
- The text-only vocabulary browser contains 163 reviewed words and expressions,
  with search, category/type filters, grammar details and sentence backlinks.
  It has no pictures, audio or progress state.
- Read-only sentence pages show source-linked grammar, variation and vocabulary
  while leaving saved learning progress untouched.

## Verification

Run `npm test`, `npm run lint`, `npm run build`, `npm run test:flashcards` and
`npm run assets:flashcards`. The browser suite uses mocked account endpoints and
does not touch Atlas. `npm run assets:flashcards -- --complete` verifies the
complete 300-card media set.
Do not deploy or push as part of this local expansion workflow.
