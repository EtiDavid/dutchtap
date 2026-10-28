# Grammar Mastery — closing report (current cross-check)

**Date:** 28 October 2026 · **Review branch:** `feat/grammar-mastery-finish-2` · **Draft PR:** #21 · **Baseline:** `7b41335` (before Grammar Mastery)  
**Final verdict: PARTIALLY COMPLETE.** The implementable product gaps addressed by PR #21 are tested, but the frozen acceptance contract still contains work that cannot be honestly self-certified: independent/native-language review, a human screen-reader/manual accessibility pass, a rollback drill, and an independent A25 sign-off. PR #21 is therefore not merged or deployed.

Detailed rows: [GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md](GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md) · Counts: [GRAMMAR-MASTERY-RECOUNT.md](GRAMMAR-MASTERY-RECOUNT.md) · Work history: [GRAMMAR-MASTERY-WORKLOG.md](GRAMMAR-MASTERY-WORKLOG.md).

## Baseline → current counts

| Item | Baseline | Current |
| --- | ---: | ---: |
| Protected Everyday + Dutch at Work cards | 1,200 | **1,200**, historical IDs/text/media fingerprint-protected |
| Authored Grammar Pattern cards | 196 | **1,506** |
| Reused grammar aliases | 0 | **184** aliases of 180 distinct original sentences |
| Playable grammar base cards | 196 | **1,690** across **21 topics** |
| Sentence-specific analyses | 0 | **1,690 / 1,690** |
| Effective Dutch-first grammar prompts | — | **1,690 / 1,690** |
| Passive lesson examples | — | **480** |
| Deep authored child variations | 0 | **100** in ten ALS families |
| Runtime tracked grammar children | 0 | **126 across 36 families**: 100 deep authored + 26 conservative same-meaning analysis contrasts |
| Separable-verb lemmas | — | **68** (184 separable base cards) |
| Uncued Mixed Grammar challenges | 0 | **61** |
| Topic lessons | — | **21**; every lesson now lists at least one source, with source depth still varying |

All numeric card targets in plan §5.3 are met. Counts do not certify naturalness. The variation recount now reports each topic's uncovered parents rather than padding missing families with generic swaps.

## What PR #21 closes

- **Meaningful variations beyond the old exactly-ten rule.** Grammar families now support **1–10** children. The existing ten deep ALS families stay intact. A non-ALS card gets a tracked child only when its existing sentence analysis contains a Dutch-first situation and a contrast with the same English meaning. Child IDs/progress remain independent.
- **Natural alternatives beyond ALS.** The authored ALS alternatives remain. A same-meaning analysis contrast may also become an accepted model with its explanation; different-meaning contrasts remain teaching contrasts and are not silently accepted as equivalent.
- **Typed production before reveal.** Grammar Speaking now offers an optional Dutch draft. A stored-model match is confirmed after reveal; an unmatched answer is described as different from the stored models, never automatically “wrong Dutch”.
- **Lesson usability.** Topic lessons include a short reveal-based self-check. Study remembers the learner's open/closed preference; Speaking and Quiz always start with the guide closed so recall is not leaked.
- **Advanced connector sourcing.** ANS/IVDNT references now support `gesteld dat`, `stel dat`, `voor het geval dat`, `op voorwaarde dat`, comparison/manner `zoals`, and time-conjunction `nu` / `sinds`. Formal conjunction `daar` remains explicitly flagged as the weakest sourced claim.
- **Transparent coverage.** The generated recount distinguishes authored base cards, aliases, source tags, passive examples, deep variations and analysis-derived runtime children, including per-topic variation shortfalls.
- **Documentation.** Architecture, Grammar Patterns and authoring guidance now describe the actual lesson/analysis/variation/alternative/reuse boundaries instead of the older partial-release snapshot.

## What remains genuinely open

- **A17 / language certification:** all new grammar content is AI-edited. No native speaker or independent human has reviewed the full lessons/cards/analyses/mistakes/alternatives.
- **A25 / independent final review:** cannot be performed by the same implementation author and remains blocked.
- **Human accessibility:** automated axe/keyboard/overflow coverage exists, but no person has completed a screen-reader walk-through.
- **Rollback drill:** rollback instructions exist; an actual rollback/redeploy drill has not been executed.
- **Live-account / Atlas suite:** the Atlas-backed account lifecycle/game E2E remains deliberately outside the isolated grammar CI. The optional Mongo tests are skipped in normal CI unless a throwaway `TEST_MONGODB_URI` is provided.
- **Multi-topic skill identity:** explicit aliases have separate grammar ratings and source tags never create false credit. Tags still do not automatically become extra session cards; doing that safely requires topic-specific analysis/rating semantics rather than treating a tag as mastery.
- **Variation breadth:** 36 of 1,690 parents currently have a verified family. This is a visible content shortfall, not hidden by filler.

## Latest code validation

Grammar feature validation run **40613586900** on the PR #21 code head before this report refresh:

- deterministic grammar regeneration: **pass**
- `npm run lint`: **pass**
- `npx next typegen`: **pass**
- `npx tsc --noEmit`: **pass**
- `npm test`: **573 passed, 13 skipped** across 63 test files (the 13 optional tests require Mongo)
- `npm run content:learning-check`: **pass**
- `npm run build`: **pass**
- focused Chromium grammar journeys: **9 passed** in 22.1s, including the full ALS lesson → Study → Dutch-first/typed Speaking → Quiz journey, responsive widths, variation persistence and Grammar Patterns behavior

The 13 skipped Mongo tests are not failures; prior project evidence records them passing against a throwaway local MongoDB when `TEST_MONGODB_URI` is configured. Atlas-backed `tests/e2e` was not run in this PR.

## Regressions and migration safety

- Existing core card IDs/content/media remain fingerprint-protected.
- Grammar aliases keep their own ratings; original Everyday/Work ratings are not promoted by grammar practice.
- Existing session schema remains compatible with old sessions; variable-size variation families are constrained to 1–10 and validate through the same stored-session schema.
- Mixed Grammar remains separate from the four sentence levels, avoiding false mastery promotion.
- French grammar exclusion and legacy game code remain protected by existing test suites.
- PR #21 is additive to current `main`; it is not deployed while draft.

## Rollback

Current production follows `main` through Vercel's Git integration. PR #21 has not changed production, so its rollback is simply “do not merge” or close the PR. If a later merge needs reversal, revert the PR #21 merge commit and redeploy that resulting `main`; stable grammar/base IDs mean existing ratings remain stored and become unused rather than corrupted. A real rollback drill is still required before A23 can be called fully verified.

## Editorial accuracy

Sources are recorded in the topic lessons and the new ANS/IVDNT references close several previously explicit source gaps. This does **not** turn AI-authored content into native-reviewed content. The app and docs retain `independentHumanReview: false` / equivalent warnings, and unverified claims remain identified rather than promoted to fact.

## Deployment state

The current production site already contains the Grammar Mastery foundation merged before PR #21. **PR #21 is draft, unmerged and not production-deployed.** Merging it would deploy through the current Vercel Git integration, so deployment should happen only after the owner accepts the remaining external-review gates.

## Final verdict

`PARTIALLY COMPLETE`.

The remaining blockers are no longer hidden engineering placeholders: they are explicitly the independent/native review, human accessibility/manual checks, rollback drill, optional live-account testing, broader verified variation content, and the unresolved multi-topic skill-model decision. Do not label the full master plan `COMPLETE` until those acceptance requirements are genuinely satisfied.
