# Grammar Patterns — scope, implementation and teaching

> **Status: PARTIALLY COMPLETE.** [PR #15](https://github.com/EtiDavid/dutchtap/pull/15) was MERGED into `main` on 26 October 2026, carrying the 13-topic / 485-base-card partial Grammar Mastery foundation. This merge did **not** automatically deploy (production is tag-only) or satisfy the full acceptance plan. The live site may still serve an older release. See the [acceptance audit](GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md) and [approved master plan](GRAMMAR-MASTERY-MASTER-PLAN.md).

## Learner experience in the merged partial implementation

- The **Practise → Grammar Patterns** tile grid selects a topic and opens a prefilled creation dialog (`/flashcards?new=grammar:als`). The base selection stays fixed between Study, Speaking and word-order Quiz; card levels start Difficult.
- **Learn the rule:** a topic-level collapsible guide in session creation and practice. Six topics have expanded first-release guides (ALS, separable, inversion, omdat, dat, verbs). Seven others remain short/foundational. Study begins with the topic guide expanded; Speaking and Quiz keep it collapsed by default.
- **Study:** read, listen to device Dutch speech, read English meaning, inspect an individual rule and ten **passive** related examples. **Limitation:** original 432 authored grammar cards still lack the full structured per-card breakdown chips found in the Everyday/Workplace decks; reused core cards inherit source breakdowns. An ALS-specific clause view exists but is not a complete sentence parser.
- **Speaking:** answer a situational prompt aloud, reveal Dutch, then **self-rate**. No automatic speech-to-text or pronunciation scoring. An optional English-help toggle is available **only for the 236 authored grammar cards that include a Dutch-first prompt**; other cards fall back to English until authored and checked.
- **Word-order Quiz:** reconstruct a model sentence with word tiles. The 58 new ALS sentences form 29 clause-order contrast pairs with a second saved and recognisable model. A broader set of alternative answers and optional typed/uncued mixed grammar inside the flashcard session are **not** finished. The older `/learn` lab has additional typed and mixed exercises.
- **Find and fix a mistake:** each current topic lesson has a non-scoring optional correction exercise. Its response check compares one stored model; another grammatical correction may be valid even if not matched.
- **Extra interactive variations:** only **ten ALS base cards** have ten separately tracked child questions each (**100 total**); the other grammar parents have no ready ten-child family. The ten passive examples displayed in notes are **not** independently scored questions.
- **Progress:** each reused core reference receives a grammar-specific alias ID and level; the original card's level is unchanged. This does not yet implement full skill-by-topic mastery or multi-topic tagging.

## Exact merged-feature inventory (26 October 2026)

Counts below represent **playable base cards**, NOT passive examples or optional children.

| Topic ID | Authored cards | Reused original cards | Playable total | Topic lesson |
| --- | ---: | ---: | ---: | --- |
| `inversion` | 62 | 38 | **100** | Expanded v1 |
| `als` | 77 | 23 | **100** | Expanded v1 |
| `omdat` | 91 | 9 | **100** | Expanded v1 |
| `dat` | 64 | 36 | **100** | Expanded v1 |
| `toen` | 98 | 2 | **100** | Introductory |
| `wanneer` | 88 | 12 | **100** | Foundational |
| `terwijl` | 59 | 1 | **60** | Expanded v1.1 |
| `voordat` | 40 | 10 | **50** | Expanded v1.1 |
| `nadat` | 50 | 0 | **50** | Expanded v1.1 |
| `tot` | 49 | 11 | **60** | Expanded v1.1 |
| `verbs` | 100 | 0 | **100** | Expanded v1.1 |
| `separable` | 184 | 0 | **184** | Expanded v1 |
| `tense` | 100 | 0 | **100** | Expanded v1.1 |
| `zodra` | 49 | 11 | **60** | Expanded v1.1 |
| `of` | 48 | 12 | **60** | Expanded v1.1 |
| `hoewel` | 59 | 1 | **60** | Expanded v1.1 |
| `indirect` | 85 | 15 | **100** | Expanded v1.1 |
| `relative` | 97 | 3 | **100** | Expanded v1.1 |
| `connectors` | 40 | 0 | **40** | Expanded v1.1 |
| `exceptions` | 36 | 0 | **36** | Expanded v1.1 |
| `daar` | 30 | 0 | **30** | Expanded v1.1 (limited sources) |
| **TOTAL** | **1506** | **184** | **1690** | **21 topics** |

There are also **68 authored separable-verb lemmas** (within the 60–100 target; **not** independently native-verified), 100 interactive child variations on ten ALS parents, and 1,200 protected original Dutch Core cards. 432 authored grammar cards have unique IDs and sentence texts. Of those, 236 include `scenarioNl` (Dutch-first prompt) and 196 lack it. Reused core aliases currently do not provide independent Dutch-first prompts.

## Authoring and safety

- Canonical grammar-generation inputs: `data/learning-tasks.json`, `data/editorial/grammar-pattern-extra.tsv`, `data/editorial/grammar-als-expansion.json`, `data/editorial/grammar-new-time-patterns.json`, `data/editorial/grammar-separable-cards.json`, `data/editorial/grammar-separable-verbs.json`; the deterministic generator is `scripts/build-grammar-patterns.py`. Never edit just the generated JSON.
- `data/grammar-reuse-links.json` explicitly lists 184 source IDs; `lib/flashcards/engine.ts` materializes runtime grammar aliases and preserves the originals.
- `data/grammar-topic-lessons.json` holds lesson-wide explanations and optional mistake-repair prompts, not per-card certified linguistic analyses.
- `data/grammar-variation-families.json` holds the three initial ALS ten-child families. Device Dutch speech is used; no paid grammar audio or new pictures are required.
- Full grammar tagging, new interactive variations for other parents, additional topic coverage, cross-device migration/restore tests, independent content QA, accessibility tests and production release must follow the [master plan](GRAMMAR-MASTERY-MASTER-PLAN.md).
- **Do not claim a pass in one Playwright subset or all structural tests is proof of natural Dutch quality.** The branch's content is AI-edited, not independently native-certified.

## Tests and deployment

Relevant tests: `tests/grammar.*.test.ts`, `tests/flashcard-e2e/grammar-mastery.spec.ts`, `tests/flashcard-e2e/grammar-patterns.spec.ts`, and `.github/workflows/grammar-feature-validation.yml`.

The scoped [CI run 40367520391](https://github.com/EtiDavid/dutchtap/actions/runs/40367520391) passed 346 Vitest tests (7 optional database tests skipped) and 5 Chromium browser tests, including ALS variation-toggle persistence. This is a **subset** of the required final acceptance/migration tests. PR #15 is merged into `main`, but release to production requires an authorized version tag and full release checks; see [deployment instructions](DEPLOYMENT.md).
