# Stage 2 handover: the second 300 sentences

Branch **`feature/next-300-sentences`**, created from `main` at `6fd4c9a` (after the `shopping-05` correction).
Nothing was pushed, merged or deployed. Source: Codex's preparation branch `codex/next-300-preparation`
at commit `423334f` (`content-preparation/next-300/`, not copied into this branch; it stays on that branch as the review record).

## 1. What changed

| Area | Change |
| --- | --- |
| Deck | 300 new cards `work-31` to `work-330`, all in the existing **Work** topic, in `data/flashcard-additions-2.json`. `lib/flashcards/engine.ts` now builds `CARDS = originals + additions + additions-2` (600). |
| Pictures and recordings | 300 pictures in `public/illustrations/cards/`, 300 recordings (Diederik, manually recorded, split and alignment-checked) in `public/audio/flashcards/`. The original 600 files are untouched. |
| Notes and breakdowns | `data/grammar-notes.json` and `data/grammar-breakdowns.json` gained 300 entries each (additions only; existing entries unchanged). |
| Vocabulary | `data/vocabulary.json`: 278 new entries and 32 new occurrences added to existing entries (163 to 441 entries). |
| Adapted sentences | 145 of the 300 are reworded from the source video. They carry `adapted: true` and the breakdown panel says so. 155 keep the source wording. |
| Session engine, API, store, service worker | **No change.** New cards only appear in sessions created after this change; existing sessions keep their stored `cardIds`. |
| Tests | Counts updated (deck 600); new `tests/expansion2.content.test.ts`; one e2e count (`600 cards`). |
| Asset script | `scripts/check-flashcard-assets.mjs` now checks 600 cards. |

## 2. How the Codex data was mapped

* Card fields kept: `id, category, dutch, english, cue, scenario, grammar, variation, image, audio, difficulty, vocabularyIds`, `source {videoId, timestampSeconds}`.
  Dropped staging-only fields (`grammarTags`, `textStatus`, `integrationStatus`, source URL and extraction method). `imageStatus` and `audioStatus` are `ready`; `quizMode` is `order`, like the other additions.
* Notes: only `rule` and `examples [{dutch, english}]` are used. Codex's extra fields (segments, relevantGrammar, verification references and so on) stay on its branch.
* Breakdowns: `meaning, parts, order, forms, compare, mistake`. Part labels: 49 live labels plus 2 new ones, *infinitive cluster* and *subordinate clause* (51, under the cap of 60).
* Vocabulary: `status` dropped; the 32 occurrence updates were appended to existing entries without changing them.
* **Edits made during integration** (the only content changes to Codex's text): the *why this word order* line of 5 breakdowns that were too thin (`work-40`, `work-239`, `work-256`, `work-259`, `work-308`), and for 91 breakdowns a one-sentence principle was put in front of Codex's text (for example "In a main clause the finite verb is in second position, after one first constituent."), chosen from the labelled parts, because the existing test requires every sentence to name the principle that applies. `work-215`, `work-224`, `work-278` got a "Laten we" principle by hand.

## 3. Checks (final run on this branch)

* `npx tsc --noEmit`, `npx eslint`: clean.
* `TEST_MONGODB_URI=mongodb://127.0.0.1:27018 npx vitest run`: 251 passed.
* `npm run assets:flashcards -- --complete`: 600 of 600 pictures and recordings, no errors, no repeated picture bytes.
* `E2E_PORT=3100 npm run test:flashcards`: 52 passed.
* `npm run test:prod`: 2 passed.
* Not run: the Atlas-backed `tests/e2e` suite (creates real accounts).

## 4. Known limits and what is still open

* **No native-speaker review** of any of the 300 sentences, breakdowns, notes or vocabulary. Codex's review was independent AI/reference checking plus speech recognition for audio; four ambiguous clips were confirmed by the owner. The adapted sentences are not official source sentences.
* **One topic.** All 300 are *Work*. A session on *Work* now draws from 320 cards; other topics are unchanged. A rebalance (new topics) would need new entries in `CATEGORIES` and is not done.
* **Grammar coverage not re-audited.** `docs/GRAMMAR-COVERAGE.md` still describes the first 300; Codex's coverage table was written at its 50-card checkpoint and is stale. Re-run the audit before claiming any of the 5 earlier gaps are closed.
* The "why word order" text for the 91 prefixed breakdowns is a general principle plus Codex's specific text; it is correct but repetitive.
* Existing users' level records are untouched; new cards start as Difficult.
* The Docker image is larger (about 300 more pictures and recordings).

## 5. Merge checklist for the owner

1. Review the diff: `git diff main...feature/next-300-sentences --stat` (mostly data and media).
2. Spot-check in the app (`/flashcards`, topic Work): a few cards, their pictures and recordings, an *Adapted* sentence, the Words page.
3. Listen to a sample of the new recordings. Batch 4 of the first set was recut by Codex because of a duplicate tail; batches 11 and 12 were checked by speech recognition.
4. Merge only after the Vercel preview builds (the media adds a lot of bytes).
