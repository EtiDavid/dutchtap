# Stage 1 handover: persistent learning sessions

Branch **`feature/persistent-sessions`**, created from `main` at `197c084` (the merge of pull request #3).
Nothing was pushed, merged or deployed.

* `893c717` Add persistent learning sessions (Study, Speaking, Quiz) with account and guest storage
* `7dcf8de` Add detailed sentence breakdowns, coverage audit, logout scoping and the Stage 1 handover
* the head commit (`git log -1`) only records those hashes and the final test results in this file.

Stage 1 uses the **existing 300 sentences**, their pictures, recordings, vocabulary and grammar notes. No sentence, ID,
picture or recording was changed, and the next 300 sentences are **not** included.

## 1. What was built

A **session** is one fixed set of sentences, chosen once, shared by three modes. It survives refresh, navigation,
logout/login and (for accounts) other devices. Guests get the same sessions on the device.

| Area | Behaviour |
| --- | --- |
| Dashboard (`/flashcards`) | Create session, active sessions (max 5), completed sessions, rename, delete (one confirmation), continue, import. |
| Create dialog | Topic (default *All places*), count (10, 20, 30, 50 or custom 1 to 100), ONE starting level (default Difficult). Counts for all four levels use the latest global levels; a card with no record is Difficult. Levels with too few cards are disabled with an explanation; a selected level that becomes unavailable is flagged and creation is blocked, never silently substituted. |
| Study | Shuffled *complete* rounds, each card once per round, no first-card repeat between rounds when avoidable. No grading, no counters. Position, round order and current card survive mode switches and refreshes. |
| Speaking | Picture + situation first. After *Check the Dutch*, an **explicit rating is required** (even if the last level is shown as a hint). No skip. Weighted random draw 8/4/2/0.5, no immediate repeat while two or more remain. **Ten consecutive Mastered ratings retire a card in this session.** Reveal/listen/leave/refresh never count. The rating updates exactly one global level. |
| Quiz | Word order, per-word tokens (repeated words work), seeded and persisted shuffle, partial answer persisted. +10 per correct, 0 per wrong; wrong resets the card's streak and raises its draw weight; **ten correct in a row retire** the card. One attempt scores once. |
| Completion | A session is archived **only when both** Speaking and Quiz are complete; Study alone never completes it. Completed sessions keep history, stay open for Study, free a slot, never auto-reset. "Practise this set again" makes a NEW session over the same cards with fresh counters (subject to the five-active limit). |
| Navigation | Tab bar (Home, Flashcards, Quiz, Words) with a dot when an active session exists; Quiz tab opens a session chooser; sessions open at `/flashcards?session=ID&mode=...`; vocabulary and sentence links return to the same session/mode/card via browser Back. |
| Explanations | Every sentence has a detailed collapsible **sentence breakdown** plus the earlier short rule and 2 to 3 examples (section 9). |

Key files: `lib/sessions/` (types, engine, wordOrder, service, memoryRepo, mongoRepo, store, registry, useSessions, legacy),
`app/api/learning-sessions/`, `components/sessions/`, `components/nav/AppNav.tsx`, `public/sw.js`.

## 2. Data model

`Session` (validated by `sessionSchema` in `lib/sessions/types.ts`; the same schema checks local storage, imports and the API):

```jsonc
{
  "id": "uuid", "name": "Shopping · 10 Difficult cards · 13 Oct",
  "cardIds": ["shopping-01", "..."],            // fixed, distinct, validated against the deck; never changes
  "topic": "all | shopping | ...", "startingLevel": "difficult|medium|easy|mastered",
  "createdAt": "ISO", "updatedAt": "ISO", "status": "active|archived", "completedAt": "ISO|null",
  "rev": 0,                                        // server revision, incremented on every stored change
  "study":    { "order": ["..."], "pos": 0, "round": 1 },
  "speaking": { "current": { "cardId", "attemptId", "revealed", "chosen" } | null, "done": false },
  "quiz":     { "current": { "cardId", "attemptId", "tokenOrder": ["t3","t0",...], "answer": ["t3"], "outcome": null | {"correct","points"} } | null,
                "done": false, "points": 0 },
  "cards": { "<cardId>": { "spStreak","spDone","spAttempts","qStreak","qDone","qCorrect","qWrong","qLastWrong" } },
  "events":  [ /* last 200 attempt events: id, mode, cardId, result, level?, pointsDelta, at */ ],
  "applied": [ /* last 500 applied action ids, for idempotency */ ]
}
```

Quiz tokens are `t0..tN` by position in the **taught** sentence (`sentenceTokens`), so repeated words are distinct tokens and a saved answer
is a list of token ids. Because tokens come from the sentence text, **existing sentence text must not be edited** (section 12).

**Actions** (`actionSchema`; each carries a unique `id` and `at`): `study/next`, `speaking/open`, `speaking/reveal`, `speaking/choose`,
`speaking/submit`, `quiz/open`, `quiz/draft`, `quiz/submit`, `quiz/continue`, `rename`. A pure reducer `applyAction(session, action)` is the single source of
truth and runs identically on the device (instantly) and the server (authoritatively). It returns `{ session, applied, reason?, effects }`.
Rejection reasons: `duplicate`, `archived`, `stale`, `invalid`, `busy`, `incomplete`, `not-revealed`, `not-chosen`.
The only effect is a **level effect** (a Speaking rating), which updates one global card record.

Random choices (next card, shuffles) are made by the device and carried in the action; the server validates membership and uses a
deterministic fallback if the proposal is invalid. A refresh therefore never re-rolls anything.

## 3. API contract (all routes require the signed-in cookie; the owner is never read from the client)

| Request | Body | Result |
| --- | --- | --- |
| `GET /api/learning-sessions` | none | `200 { sessions: Session[] }` |
| `POST /api/learning-sessions` | `{ session }` (creation, practise-again, or guest import; idempotent on `session.id`) | `201 { session }` created, `200 { session }` already existed, `409 { error, code: "limit" }`, `400` invalid |
| `GET /api/learning-sessions/:id` | none | `200 { session }` or `404` |
| `DELETE /api/learning-sessions/:id` | none | `200 { ok: true }` or `404`; removes only that session |
| `POST /api/learning-sessions/:id/actions` | `{ actions: Action[] }` (1 to 60) | `200 { session, applied: string[], rejected: {id,reason}[], reviews: Record<cardId, Review> }`, `404`, `400`, `503 busy` |

Existing: `GET/POST /api/flashcards` (global levels) is unchanged; the client now POSTs only changed records.

**MongoDB** (`lib/sessions/mongoRepo.ts`), collection `learningSessions`: documents `{ userId, id, slot?, rev, session }` with
unique index `owner_session_id` `(userId, id)` and a **partial unique index `owner_active_slot` `(userId, slot)`**. An active session holds
slot 1 to 5, an archived one holds none, so the **five-active limit is enforced atomically in the database** (two tabs racing for the
sixth cannot both win; verified against a real MongoDB). Updates are compare-and-swap on `rev`: the server re-reads, re-applies the
batch to the latest stored session, and retries, so stale snapshots never overwrite cumulative counters and a deleted session is never resurrected.

## 4. Client store, sync and offline

`lib/sessions/store.ts` is local-first: every action is applied and saved to the device immediately, then queued for the account.

* Queue: `pendingCreate`, `pendingActions` (per session; only the latest `quiz/draft` per attempt is kept), `pendingDelete`.
  A session created offline keeps its **as-created snapshot**; its actions replay on top so each takes effect on the server once.
* `sync()` order: deletes, creates, actions (batches of 60), then refresh the list and re-apply unsent actions over the server version.
  Action ids make replays harmless (lost response, retry, back/forward, two tabs). Backoff 4s to 60s; also on `online` and when the tab becomes visible.
* Status shown honestly: *Saved to your account*, *Saved on this device · N changes waiting to sync*, *Syncing*, *Not synced yet: reason* + Retry. A blocked localStorage is reported.
* A server refusal (five active sessions on the account) keeps the session **on the device**, marked *Not synced* with a Retry; nothing is discarded.
* Deleted elsewhere: the next sync removes it locally with a notice; queued actions for it are dropped (no resurrection).
* Owner scoping: local keys are per person (`...:guest`, `...:user:<username>`); on logout `disposeUserStores()` drops every signed-in
  learner's in-memory state and the "session waiting" summary. Their saved copy stays under their own key for their next login.

## 5. Preserved progress and storage keys

| Key / collection | Status |
| --- | --- |
| `dutchtap:flashcards:v2:guest`, `dutchtap:flashcards:v2:user:<username>`, `flashcardReviews` | **Unchanged** global levels. Existing records are read and kept; Speaking ratings add to `seen` / `masteredCount`. Older-format server rows are still skipped on read and replaced on write. |
| `dutchtap:sessions:v1:<scope>` | New: sessions, unsent queue, last opened, refused list. |
| `dutchtap:sessions:summary:v1` | New: cosmetic navigation dot; cleared on logout. |
| `dutchtap:practice-days:v2:<scope>` | New per-person streak. The old shared `v1` list becomes the guest's streak and is never copied into an account. |
| `dutchtap:session:flashcards:v1`, `dutchtap:session:quiz:v1` | Old transient practice state. See section 6. |
| `learningSessions` (MongoDB) | New. |

## 6. Migration

* Global levels, all 300 card IDs, pictures and recordings are untouched. Nothing is reset or invented.
* **Old transient practice state:** if a valid old flashcard set exists, the dashboard offers *Keep as a session* (a fixed-deck session of exactly
  those cards, with fresh counters and no invented attempts). Otherwise it is discarded once, with an explanation that card levels are unchanged. Either choice clears the old keys.
* **Guest to account:** explicit *Import guest sessions* (oldest first). Duplicates by id are skipped, the five-active limit is honoured, surplus sessions
  stay on the device, and imported ones are removed from guest storage. Guest card levels are copied by the existing explicit button.
* Sessions refer to **stable card IDs**; the deck can grow without breaking them, and existing sessions never gain cards.

## 7. Selection and retirement rules (exact)

* Speaking weights: Difficult 8, Medium 4, Easy 2, Mastered 0.5, and 0.15 for a card marked Mastered 10 or more times (`flashcardWeight`). Retired cards have weight 0. The card just shown is excluded when two or more remain; a single remaining card stays playable.
* Speaking counter per session/card: an explicit **Mastered** after reveal adds 1 (cap 10); Difficult/Medium/Easy resets to 0. At 10 the card is retired from Speaking in this session only. All cards retired means Speaking is completed.
* Quiz weight per session/card: never answered 6; last answer wrong 10; otherwise `max(0.5, 6 - 0.5 x streak)`; retired 0. A correct answer adds 1 to the streak (cap 10), a wrong one resets it. At 10 the card is retired from the Quiz in this session. +10 points per accepted correct submission, nothing for wrong, no time bonus, no deduction.
* Counters never exceed ten. Global levels never reset another session's counters.

## 8. Concurrency rules and deliberate restrictions

* **One in-flight Speaking attempt and one in-flight Quiz question per session.** If two devices open different cards at the same moment, the first to reach the server wins and the other device's unfinished attempt is replaced by the winner's card when it syncs; it is **never counted** (no phantom rating). Counters already stored are never lost. Two devices working in different modes at once merge cleanly.
* The server applies the level effect after the session write succeeds; a crash between the two could leave the global level one rating behind. The device keeps its own copy, and the account level catches up on the next rating.
* The event log (last 200) and applied-id log (last 500) are bounded, so a very old replay (more than 500 actions behind) could not be deduplicated; offline queues are far smaller in practice.
* Global `masteredCount` / `seen` merge by recency (newest record wins), so they can differ by a rating or two between devices.
* Streaks and the "session waiting" dot are per device, not synced.
* Reminders and delayed-review scheduling are intentionally **not** implemented (the data model leaves room: `completedAt`, `events`).

## 9. Explanation structure

`data/grammar-breakdowns.json` (new, one entry per sentence, 300) holds: meaning (what the speaker does); the sentence cut into labelled parts using its own
words; *why this word order* (verb-second, inversion, question, imperative, subordinate verb-final, verb bracket; second position = second constituent, not second word);
forms and endings that matter; an English comparison; one common mistake with correction and reason. `data/grammar-notes.json` (short rule + 2 to 3 examples, plus the variation) is kept
as is. The UI is one collapsible panel (`components/flashcards/GrammarNotes.tsx`), expanded on sentence pages, collapsed on cards. Tests assert that every breakdown rebuilds exactly its sentence.
Provenance: the *why this word order* text was generated from the labelled parts and the sentence's own words, then reviewed; the rest was hand-written. **None of it has had a native-speaker review.**
See `docs/GRAMMAR-COVERAGE.md` for the pattern audit, gaps and proposals, and the duplicate audit (no duplicate sentences; one repeated vocabulary headword, *prijs*, with two legitimately different senses).

## 10. Service worker

`public/sw.js` (cache names `dutchtap-{static,pages,media}-v3`):

* Pages and RSC data: **network first** (4 s timeout), falling back to the saved copy, then the saved dashboard, then a plain offline message. Online users always get the newest UI after a deployment.
* `/_next/static/*` (hashed): cache first. Pictures, audio, icons: stale-while-revalidate. `/api/*`, non-GET, other origins and Range requests (audio seeking) are never intercepted.
* On activation every older `dutchtap-*` cache (v1, v2, anything not current) is deleted.
* `/sw.js` is served `no-cache, no-store, must-revalidate`; the page registers with `updateViaCache: "none"`, checks for an update whenever the app becomes visible, and reloads once when a new worker takes over from an old one.
* **Cache transition (documented, not just a version bump):** a returning browser still running the OLD cache-first worker may show the previous UI for **one** navigation after deployment. The new worker installs in the background (`skipWaiting` + `clients.claim`), deletes the old caches, and every later navigation is network first. A cache-version bump is not the update strategy; routine deployments need no bump because pages are network first.
* Known limits: offline audio seeking is not cached (Range requests pass through); a session page that was never visited offline falls back to the dashboard, but sessions themselves are client-state in `/flashcards`, so creating and using them offline works.

## 11. Tests and results

Results on this branch at its final state (everything below passed):

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | no errors |
| `npx eslint app components lib tests scripts` | no errors or warnings |
| `npm test` | 239 passed, 7 skipped (the 7 real-MongoDB tests need `TEST_MONGODB_URI`) |
| `TEST_MONGODB_URI=mongodb://127.0.0.1:27018 npm test` | **246 passed** (29 files) including the real-MongoDB tests |
| `npm run test:flashcards` | **52 passed** (browser; the Quiz and session tests also repeated 4 to 6 times to catch card-specific flakiness) |
| `npm run test:prod` | **2 passed** (production build, service worker) |
| `npm run assets:flashcards -- --complete` | 300 of 300 pictures and recordings, no errors |
| production build (`npm run build`, run by `test:prod`) | succeeds |

What the suites cover:

* `npm test` with `TEST_MONGODB_URI` set (real local MongoDB, never Atlas): unit tests for the engine (creation, counts and disabled levels, Study rounds, Speaking rating/weights/retirement, Quiz scoring/streaks/retirement, completion/archive, practise again), server (ownership, five-active limit including parallel creation, replay, two-device compare-and-swap, no resurrection, global-level effects once), client store (offline, lost responses, two devices, refused sessions, import, isolation, corrupted/blocked storage), service worker routing, deck content, notes and breakdowns, existing grammar-game and flashcard suites.
* `npm run test:flashcards` (browser, mobile 390px with desktop 1280px layout checks; account endpoints served by the real server logic in memory): creation dialog, counts, limits, keyboard modal, all three modes, refresh persistence, completion and archive, practise again, account sync, offline queue, owner isolation, import, two devices, deleted-elsewhere, refused session, tab bar, vocabulary return, breakdown UI, no overflow and no console errors.
* `npm run test:prod` (production build): service worker registers, old caches removed, visited pages and sessions work offline, `/sw.js` not cacheable.
* `npm run assets:flashcards -- --complete`: 300/300 pictures and recordings, no errors.
* The Atlas-backed suite in `tests/e2e` was **not** run (it creates real accounts); no production database was touched.

## 12. How Stage 2 adds content without touching the session engine

1. Append new cards to the deck (for example another file merged in `lib/flashcards/engine.ts`) with **new, unique IDs**; never change an existing ID or main-sentence text (Quiz tokens and saved answers derive from the text; changing it would also need new audio and picture).
2. Add a **new topic** only by extending `CATEGORIES` in `lib/flashcards/engine.ts` (the dialog, counts and topic names read it).
3. For each new card also add an entry in `data/grammar-notes.json` and `data/grammar-breakdowns.json` (tests require both for every card and that parts rebuild the sentence), vocabulary links, a picture and a recording (`npm run assets:flashcards -- --complete` must pass). Update the tests that assert the deck size (300) and the 50 originals' preserved hashes, if any apply.
4. Existing sessions keep their stored `cardIds`; new cards only appear in sessions created afterwards. Global levels for new cards start as Difficult automatically.
5. Nothing else changes: the engine, store, API and service worker read the deck through `CARDS`. The server schema allows up to 100 cards per session and any card present in the deck.
6. Follow `docs/GRAMMAR-COVERAGE.md` for gaps, label adapted sentences honestly (`adapted: true`), and have a Dutch speaker check any verb-cluster sentences.

## 13. Local run instructions and final state

```bash
git switch feature/persistent-sessions
npm install
cp .env.example .env.local      # MONGODB_URI and SESSION_SECRET for account features; guests need neither
npm run dev                      # http://localhost:3000/flashcards
docker run -d --name dutchtap-test-mongo -p 127.0.0.1:27018:27017 mongo:7   # optional, for the database tests
TEST_MONGODB_URI=mongodb://127.0.0.1:27018 npm test
E2E_PORT=3100 npm run test:flashcards
npm run test:prod
```

Reviewable diff: `git diff main...feature/persistent-sessions --stat`. The clutter folders `.codex/` and `data/.codex/` are not part of the change.
