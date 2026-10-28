# Grammar Patterns — scope, implementation and teaching

> **Status: CURRENT IMPLEMENTATION, STILL NOT NATIVE-CERTIFIED.** The Grammar Mastery system is on `main` and the production app. The corpus/count targets are present, but the frozen acceptance plan still requires honest provenance and independent review before the whole project can be called fully complete. PR #21 continues the remaining learning-depth and audit work on a review branch.

## Learner experience in the current implementation

- **Practise → Grammar Patterns** contains 21 topic collections plus Mixed Grammar. A topic opens the normal session creator; the selected base-card set stays fixed across Study, Speaking and Quiz.
- **Learn the rule:** every topic has one detailed, collapsible lesson with formulas, examples, mistakes and references. The same lesson is reachable in creation and all practice modes. The learner's open/closed preference is remembered per topic. Each lesson also has a short reveal-based self-check.
- **Study:** all 1,690 playable grammar base cards have sentence-specific analysis: clause spans where relevant, subject/finite verb, word order, forms, one or more mistakes and a contrast. Passive examples remain reference material rather than scored children.
- **Speaking:** grammar starts from a Dutch situation, with English help on request. The model stays hidden until reveal. The learner may optionally type a sentence before reveal; a stored-model match is reported, while an unrecognised answer is explicitly **not** labelled bad Dutch. Speaking remains self-rated; there is no microphone-based pronunciation score.
- **Word-order Quiz:** the existing tile game keeps points/streak semantics and recognises explicitly authored alternative models. In addition to the original ALS contrast pairs, a sentence-specific analysed contrast can be a model only when its English meaning matches the base card's meaning.
- **Find and fix a mistake:** session-sentence mistakes and lesson mistakes are available as an optional typed repair exercise. The check distinguishes “matches this stored model” from “different”, rather than claiming every unmatched answer is ungrammatical.
- **Interactive variations:** the registry now supports **1–10 meaningful children**. The ten deep ALS families still contain ten independently tracked children each. Other grammar cards receive a tracked child only when their existing analysis contains a same-meaning contrast and Dutch-first situation. The app deliberately does not manufacture filler to make every family ten.
- **Mixed Grammar:** uncued Dutch-first construction-choice challenges have their own local/account progress and weak-item weighting; they do not silently promote the four-level sentence rating.
- **Progress/reuse:** explicit grammar aliases have separate grammar ratings; source tags can show that one original sentence illustrates several topics but do not automatically enter that sentence into another topic session without topic-specific analysis/rating.
- **Editorial status:** grammar content is AI-edited with explicit source/review metadata. Automated checks verify structure and regressions, not native-speaker quality.

## Current grammar inventory

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

There are also **68 authored separable-verb lemmas** (within the 60–100 target; not independently native-verified), **1,506 authored grammar cards + 184 aliases = 1,690 playable grammar base cards**, and 1,200 protected original Dutch Core cards. Every playable grammar base card resolves to a Dutch-first situation and a sentence-specific analysis. The runtime variation registry currently exposes **126 tracked grammar children in 36 families**: 100 children in ten deep ALS families plus 26 one-child families derived conservatively from existing same-meaning analyses.

## Authoring and safety

- Canonical grammar-generation inputs: `data/learning-tasks.json`, `data/editorial/grammar-pattern-extra.tsv`, `data/editorial/grammar-als-expansion.json`, `data/editorial/grammar-new-time-patterns.json`, `data/editorial/grammar-separable-cards.json`, `data/editorial/grammar-separable-verbs.json`; the deterministic generator is `scripts/build-grammar-patterns.py`. Never edit just the generated JSON.
- `data/grammar-reuse-links.json` explicitly lists 184 source IDs; `lib/flashcards/engine.ts` materializes runtime grammar aliases and preserves the originals.
- `data/grammar-topic-lessons.json` holds the 21 lesson-wide explanations and references. Per-card analysis lives separately in `data/grammar-*-analysis.json` and is combined by `lib/grammarAnalysis.ts`.
- `data/grammar-variation-families.json` holds the deep authored grammar families. `lib/variations/content.ts` may additionally expose one tracked child when an existing per-card analysis already contains a same-meaning contrast. Families are 1–10 children; never add filler solely to hit ten. Device Dutch speech is used; no paid grammar audio or new pictures are required.
- Source tags, explicit aliases, accepted alternatives and variations must keep stable IDs and honest mastery semantics. A source tag alone is not enough to add a core sentence to a grammar session; it needs topic-specific analysis/rating first. Independent content QA and human accessibility checks remain external acceptance work under the [master plan](GRAMMAR-MASTERY-MASTER-PLAN.md).
- **Do not claim a pass in one Playwright subset or all structural tests is proof of natural Dutch quality.** The branch's content is AI-edited, not independently native-certified.

## Tests and deployment

The current validation workflow runs deterministic generation, lint, Next type generation, TypeScript, Vitest, content checks, a production build and focused Chromium grammar journeys. PR #21 additionally exercises the full ALS lesson → Study → Dutch-first Speaking/typed draft → Quiz path and variation persistence.

Production deploys from `main` through the repository's Vercel Git integration. Do not merge a partial review branch merely to deploy it; see [deployment instructions](DEPLOYMENT.md).

