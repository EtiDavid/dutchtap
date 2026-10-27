# Grammar Mastery — closing report (P7 cross-check)

**Date:** 27 October 2026 · **Branch:** `feat/grammar-mastery-completion` · **Evidence commit:** `cbc6a08` · **Baseline:** `7b41335` (before any grammar work)  
**Final verdict: PARTIALLY COMPLETE.** Nothing is merged to `main` from this branch, tagged or deployed. All content is AI-edited; no native speaker or independent person has reviewed any of it. Mandatory item A25 (independent re-read) is blocked, and `npm run grammar:release-gate` fails by design.

Detailed rows: [GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md](GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md) · Counts: [GRAMMAR-MASTERY-RECOUNT.md](GRAMMAR-MASTERY-RECOUNT.md) (generated from the data files, tested) · Work history: [GRAMMAR-MASTERY-WORKLOG.md](GRAMMAR-MASTERY-WORKLOG.md).

## Baseline → final counts (programmatic)

| Item | Baseline (`7b41335`) | Final |
| --- | ---: | ---: |
| Original Everyday + Dutch at Work cards (protected) | 1,200 | 1,200, every id, sentence, translation, picture and audio unchanged (fingerprint test) |
| Grammar pattern cards authored | 196 | **1,506** (all original 196 ids and sentences unchanged) |
| Reused references (aliases of core sentences) | 0 | **184** (180 distinct original sentences, each alias with its own rating) |
| Playable grammar base cards | 196 | **1,690** in **21 topics** |
| Hand-authored sentence analyses | 0 | **1,690** (every playable card) |
| Source tags (pointer, no card, no rating) | 0 | 145 on 136 sentences |
| Passive lesson examples (not cards) | 0 | 480 |
| Interactive child variations | 0 | 100 (10 ALS families) |
| Distinct separable verb lemmas | — | 68 (184 separable cards) |
| Uncued mixed-grammar challenges | 0 | 61 |
| Topic lessons | — | 21 (3 at v1.0, 18 at v1.1; 10 cite no source) |

Plan §5.3 count targets are all met by this recount. Honest count notes: 58 of the 100 ALS cards are 29 pairs (71 distinct tasks); 1,680 of the 1,690 base cards have no variation family.

## Completed (verified, narrow)

- **A24** Frozen Academy curriculum: no such file exists or changed; the protected 1,200 cards are fingerprint-checked (`tests/grammar.id-stability.test.ts`).
- Structural facts with tests: deterministic regeneration, unique ids and sentences, stable legacy ids, no renumbering, every alias/tag/analysis resolves, old saved sessions still validate and run (`tests/grammar.migration.test.ts`).

## Partial / blocked / deferred

Every other row is **PARTIAL**; **A25 is BLOCKED**. The remaining action for each is in the audit table. The common causes: no native review; ALS-only variations; thin or missing sources for some lessons; tags that display but do not feed sessions; no person has walked the manual scenarios of plan §10.2 or used a screen reader.

## Tests (exact results, 27 Oct 2026)

See the table in the audit ("Tests and deployment evidence"). In short: lint, typegen, tsc, build and all content checks exit 0; Vitest 570 passed (13 skipped, need a local MongoDB); real-MongoDB tests 13 passed; Chromium flashcards suite 177 passed; production offline suite 4 passed; release gate fails as designed. Not run: the Atlas-backed `tests/e2e`.

## Regressions and migrations

- **Data is additive.** New files and rows only; 133 lines were deleted in the whole 166-file diff against the baseline, in application code, none in the protected card files.
- **Stored data.** Existing keys are unchanged (`dutchtap:flashcards:v2:*`, `dutchtap:sessions:v1:*`). New keys: `dutchtap:grammar-mixed:v1` (guest) and `dutchtap:grammar-mixed:v1:user:<name>`; one new MongoDB collection, `grammarMixedProgress` (unique on `userId + id`, created on first use). Session schema, store and service are byte-identical to the baseline, so no migration step exists or is needed.
- **Visible changes outside grammar:** the accent colour is `#b93c09` instead of `#c2410c` (contrast fix, buttons slightly darker); the session title is an h1 and some headings changed level; the Home header wraps at narrow widths; Home now loads the learner's levels once for the grammar progress tiles; sessions deduplicate by original sentence.

## Rollback

1. Before release: nothing to undo; the branch is unmerged.
2. After a release by tag: redeploy the previous `v*` tag (deployment is tag-only, see `docs/DEPLOYMENT.md`). Learners keep their Everyday, Work and French levels and sessions, because their keys and schema are unchanged. Ratings of new grammar cards and mixed-grammar answers would stay in storage unused; the `grammarMixedProgress` collection can stay or be dropped without effect on other data.
3. A rollback drill has **not** been performed.

## Editorial accuracy

All lessons, cards, analyses, mistakes and situations were written and checked by the AI (Claude), with web sources read through search summaries and page fetches where cited. A stratified sample (84 cards, 4 per topic) was re-read on 27 October 2026; it found one acceptable-Dutch "mistake" and one unnatural English gloss, both fixed. Two earlier sourced corrections (`aangezien`, `mits`) came from reading Taaladvies pages. Ten lessons cite no source and six topics are only partly sourced. **No native speaker has reviewed anything**, and the sampling pass is not independent.

## Deployment

Branch only. `main` already contains the earlier, partial grammar foundation (PR #15) and the documentation PR #16. This branch has not been merged, tagged or deployed, and no live smoke test exists. **Security:** `npm audit` reports 8 vulnerabilities, 4 in production dependencies, including a critical set against the installed Next.js 16.3.5; this predates the branch. The fix (Next.js 16.4.3) is on the unmerged branch `chore/nextjs-security-upgrade`, which needs owner review.

## Final verdict

`PARTIALLY COMPLETE`. Do not call the Grammar Mastery scope complete, and do not merge this branch or push a production tag until the independent review, native review, a fresh CI run, the merge of the Next.js upgrade branch and the manual walk-throughs are done.
