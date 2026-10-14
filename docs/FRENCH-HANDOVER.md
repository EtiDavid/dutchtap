# French as a second learning language — handover

Branch: `feature/french-learning` (from `main` at d7db817). Not pushed, merged or deployed. Container not rebuilt unless requested.

## Scope delivered
* Learner picks **Nederlands** or **Français** on first launch (remembered; switch always visible; interface stays English). Existing Dutch
  learners (any Dutch local data) go straight to Dutch with no prompt.
* French Study, Speaking and word-order Quiz sessions; French vocabulary; read-only sentence pages; grammar notes and breakdowns.
* French has **no MP3s and no pictures of its own**: the 600 shared pictures are reused; sentences are spoken by the device voice.
* Dutch-only games stay Dutch-only. Dutch strings, ids, tokens, pictures, recordings and global levels are unchanged.

## Content
* 600 French sentences (`data/fr/cards.json`), one per shared card id, Belgian-friendly French; tu/vous/neutral register stored per card
  (432 neutral, 97 tu, 71 vous). 792 vocabulary entries derived from the sentences (nouns carry article and gender).
* Each card has a note in simple French with English help, 2–3 distinct examples with English meanings, one variation with meaning,
  a breakdown (parts rebuild the sentence) and one common mistake with explanation.
* Scenarios/cues are shared; two mentioned "Dutch" and were reworded for French (conversation-01, work-306).
* **Review status:** AI-written and AI-checked only. A build-time linter checked structure, elision/contraction, agreement, example counts and
  vocabulary links. **No native or qualified French speaker has reviewed it, and no native-speaker claim is made.** Full table:
  [french/REVIEW-TABLE.md](french/REVIEW-TABLE.md) (regenerate with `node scripts/french-review-table.mjs`).
* Pictures were not re-inspected one by one for Dutch text or culture; mismatches found by learners should be flagged against the card id.
* [GRAMMAR-COVERAGE.md](GRAMMAR-COVERAGE.md) has **not** been re-audited for the 600 cards, French or Dutch.

## Data and storage
See the "Learning languages" section of [ARCHITECTURE.md](ARCHITECTURE.md). Additive only: `flashcardReviews_fr` is a new collection; sessions
get a `lang` field (missing = `nl`). Practice days: `dutchtap:practice-days:v2:fr:<scope>`. Voice preference: `dutchtap:voice:<lang>:v1`.
Rollback note: delete/archive French sessions before rolling back.

## Word-order tokens
French keeps `j’habite`, `l’école`, `aujourd’hui`, `qu’il`, `est-ce`, `puis-je` as single tokens, keeps accents, strips only surrounding punctuation.

## Speech limits
Browser voices vary. Order: fr-BE → fr-FR → other `fr`; reacts to `voiceschanged`; never falls back to a Dutch/English voice (a clear
message and install hint show instead); voice selector offered; speech cancels on language switch/navigation; Speaking never reads the
sentence before reveal. Offline: pages for `?lang=fr` are precached, but voices depend on the device.

## Tests
* `tests/french.content.test.ts` — 600 cards, notes, breakdowns, vocabulary, tokens.
* `tests/french.sessions.test.ts` — immutable language, cross-language five-session limit (including simultaneous creates), legacy `lang`, review isolation.
* `tests/flashcard-e2e/french.spec.ts` — 13 browser tests (chooser, switch, sessions, quiz, speech messages, vocabulary, sentence pages).
* Existing suites updated for the language-keyed review key and the Dutch preference seed. Atlas-backed `tests/e2e` were **not** run (never against production).
* `scripts/check-flashcard-assets.mjs` checks the Dutch pictures/recordings only (600/600); French has no assets by design.

## Known issues / follow-ups
* Native-speaker review of all French content.
* Visual picture review for Dutch-specific signs.
* Optional: French MP3 recordings later; the `Speakable.audio` field already allows them.
