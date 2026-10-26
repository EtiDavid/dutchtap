# DutchTap Grammar Mastery — Implementation Work Log

This is a living implementation log, **not a claim that the full master plan is complete**.
The approved baseline remains `docs/GRAMMAR-MASTERY-MASTER-PLAN.md`.
Source material is AI-edited and is **not** independently certified by a native speaker.

## 2026-10-26 — Claude Code continuation: P2 Wanneer to 100 base cards with per-sentence analysis

**Branch:** `feat/grammar-mastery-completion`. Nothing merged, tagged or deployed.

**Done**
- Wanneer had 14 cards and 12 core sentences that use it (now linked as aliases). 74 new authored cards (`data/editorial/grammar-p2-wanneer.json`, ids `pat-wanneer-15..88`): 16 wanneer-first, 14 main-clause-first, 16 direct questions, 14 indirect questions, 8 repeated-past (`wanneer` for habits, with `toen` shown as the wrong choice for a repeated pattern), 6 with perfect, passive or modal chains.
- All 100 have a hand-authored record in `data/grammar-wanneer-analysis.json`. Direct questions are analysed as one main clause (question word, finite verb second); indirect questions and time clauses as main + subordinate clause. The sense label says which of the uses applies.
- The 14 older cards got rewritten Dutch prompts where the old prompt contained the conjunction or was too short; the 12 linked cards got new ones.
- Tests: Wanneer added to the generic per-topic suite; `tests/flashcard-e2e/grammar-wanneer-analysis.spec.ts` (3 scenarios). Docs counts updated (699 authored + 82 aliases = 781; 503/699 Dutch prompts).
- Process fix: while writing, two cards (77, 79) were first built with the clause kinds swapped; the generic test caught it and both were corrected.

**Evidence:** `npx tsc --noEmit` clean; eslint clean; `npx vitest run` (with local Mongo) 407 tests passed; browser specs for Wanneer 3 passed (Dat and Toen passed in the previous batch). Full browser suite NOT re-run.

**Known issues / open:** no native review; the Wanneer lesson (v0.8) has not been re-fact-checked; Toen and Wanneer lessons still need to be rewritten together; several first-draft mistakes were valid Dutch and were replaced; Wanneer has no interactive children.

**Next specific task:** P2 V2/inversion (20 → 100), then the joint Toen/Wanneer lesson upgrade and a full browser-suite run.

## 2026-10-26 — Claude Code continuation: P2 Toen to 100 base cards with per-sentence analysis

**Branch:** `feat/grammar-mastery-completion`. Nothing merged, tagged or deployed.

**Done**
- Only two core sentences use the conjunction `toen` (already linked), so Toen gets 78 new authored cards (`data/editorial/grammar-p2-toen.json`, ids `pat-toen-21..98`): 20 toen-first, 14 main-clause-first, 8 past perfect in the main clause, 8 perfect tense (spoken style), 8 `toen` as the adverb "then", 8 questions containing a toen-clause, 6 whole periods, 6 negated/modal. With the 20 legacy and 2 linked cards that makes 100.
- All 100 have a hand-authored record in `data/grammar-toen-analysis.json`. Adverb `toen` (= then) is analysed as one main clause (pattern `demonstrative`, which now also covers adverbs) so it is never shown as a subordinate clause; periods are told apart from single occasions in the sense text and in contrast notes (`als` for repeated).
- The 20 legacy cards had no Dutch prompt and an English scenario saying "Start with Toen"; they now carry `situationNl` and a rewritten `situationEn`. All 78 new prompts avoid the conjunction cue.
- Tests: Toen added to the generic per-topic suite; `tests/flashcard-e2e/grammar-toen-analysis.spec.ts` (2 scenarios). Docs counts updated (625 authored + 70 aliases = 695; 429/625 Dutch prompts).

**Evidence:** `npx tsc --noEmit` clean; eslint clean; `npx vitest run` (with local Mongo) 400 tests passed; targeted browser specs for Dat and Toen 5 passed. Full browser suite NOT re-run.

**Known issues / open:** no native review; the Toen lesson (v0.2) is still introductory and has not been expanded or fact-checked beyond the Taaladvies distinction; Belgian usage (toen is the only correct conjunction for one past event) appears in this log but not yet in the lesson text; the first drafts of several analyses had repeated or too-short explanations and were rewritten per card; Toen has no interactive children.

**Next specific task:** P2 Wanneer (14 → 100), then V2/inversion (20 → 100); then upgrade the Toen and Wanneer lessons together because the two topics define each other.

## 2026-10-26 — Claude Code continuation: P2 Dat to 100 base cards with per-sentence analysis

**Branch:** `feat/grammar-mastery-completion`. Nothing merged, tagged or deployed.

**Done**
- Dat: 44 new sentences (`data/editorial/grammar-p2-dat.json`, ids `pat-dat-21..64`): 24 report-verb-first, 6 time/attitude-fronted, 4 negated-opinion (`ik denk niet dat`), 3 yes/no questions, 7 relative-clause (`dat`/`die`) cards. Together with 20 legacy cards and 36 linked source sentences (19 earlier + 17 new in `data/grammar-reuse-links.json`) that is 100 base cards.
- All 100 have a hand-authored record in `data/grammar-dat-analysis.json`. Because `dat` is not always a conjunction, three pattern types exist: subordinate (report/question/negated), `relative` (main clause cut in two by a relative clause; the finite verb of the main clause is checked across both halves) and `demonstrative` (13 linked cards such as "Dat is een goed punt", one main clause, no subordinate clause). The record's `sense` names which use of `dat` it is.
- Dutch-first situations (`situationNl`) written for all 36 linked cards (they had none) and for every card whose original prompt contained the word `dat`; the conjunction is never cued.
- Tests: generic per-topic suite now also covers Dat (14 tests per run); relaxed one check to accept both clause orders and `bijzin+hoofdzin+bijzin`; `tests/flashcard-e2e/grammar-dat-analysis.spec.ts` (3 scenarios).
- Docs counts updated in audit, GRAMMAR-PATTERNS and README (547 authored + 70 aliases = 617; 351/547 Dutch prompts).

**Evidence:** `npx tsc --noEmit` clean; eslint clean; `npx vitest run` (with local Mongo) 51 files, 393 tests passed; targeted browser spec for Dat 3 passed. Full browser suite NOT re-run after this batch.

**Known issues / open:** no native review; several Dat mistakes were rewritten because the first draft contained valid Dutch; Dat has no interactive children; the Dat lesson (v1.0) has not been re-fact-checked against sources; the 13 demonstrative cards are alias sentences and teach `dat` as a pointing word only.

**Next specific task:** P2 Toen (22 → 100), then Wanneer (14 → 100) and V2/inversion (20 → 100), each with analyses, Dutch-first prompts and lesson fact-check; Toen/Wanneer must keep the single-past-event vs repeated-event distinction (Taaladvies; Belgium uses toen only).

## 2026-10-26 — Claude Code continuation: P2 Omdat to 100 base cards with per-sentence analysis

**Branch:** `feat/grammar-mastery-completion`. Nothing merged, tagged or deployed.

**Done**
- Generator: `scripts/build-grammar-patterns.py` now reads one file per topic, `data/editorial/grammar-p2-<topic>.json`, and appends new ids after the topic's existing ones (never renumbering). Output stays deterministic.
- Omdat: 71 new sentences (`data/editorial/grammar-p2-omdat.json`): 34 reason-first, 24 reason-after, 8 `want` contrast cards (two main clauses, tagged as contrast on purpose), 5 further varied cards. With the 20 legacy and 9 linked sentences that makes 100 base cards. Every card has a hand-authored analysis in `data/grammar-omdat-analysis.json` and a Dutch-first situation without a conjunction cue; the 20 legacy cards also got `situationEn` rewrites because their English scenario said "Explain using omdat".
- Analysis infrastructure generalised: `lib/grammarAnalysis.ts` loads every topic file; records carry `sense` ("omdat = because", "want = for/because (coordinating)") and an optional `pattern: "coordinate"` for contrast cards. The clause map shows a generic sense chip (`topic-sense`).
- Tests: `tests/grammar.analysis-topics.test.ts` (7 per topic, parameterised; coverage test requires every Omdat base card to have an analysis), `tests/flashcard-e2e/grammar-omdat-analysis.spec.ts`.

**Evidence:** `npx tsc --noEmit` clean; `npx vitest run` (with local Mongo) 51 files, 386 tests passed; targeted browser specs (Omdat, ALS analysis, patterns) 9 passed. Full browser suite NOT re-run after this batch.

**Counts:** Omdat parents 100 (20 legacy + 71 new + 9 linked); grammar cards 503 authored + 53 aliases = 556 playable; analysed sentences ALS 100 + Omdat 100; no interactive children for Omdat yet.

**Known issues / open:** no native review; the 8 want cards repeat facts from legacy omdat cards by design (contrast pairs); one record carries an open question (pronoun 'hij' for 'de fout'); Omdat has no children; the Omdat lesson (v1.0) has not been re-fact-checked against sources as the Als lesson was.

**Next specific task:** Dat to 100 (39 now), then Toen, Wanneer, V2/inversion, each with the same per-card analysis standard.

## 2026-10-26 — Claude Code continuation: P1 ALS per-sentence analysis (A03), lesson fact-check (A02), Dutch-first prompts (A05)

**Branch / base:** `feat/grammar-mastery-completion` from `main` at `3c18067` (PR #16 merged; PR #15 already on main). Nothing pushed, merged, tagged or deployed.

**Done**
- Schema decision: an additive, hand-authored overlay `data/grammar-als-analysis.json` keyed by existing card id (including `pat-als-reuse-*` aliases). Typed access in `lib/grammarAnalysis.ts`; `breakdownFor` returns it for Dutch grammar cards, so the existing breakdown view shows meaning, parts, order, forms, compare and mistake, plus new optional fields (`clauses`, `extraMistakes`, `contrast`, `alsSense`) added to `Breakdown`. Card ids, sentences, progress and the CORE breakdown files are untouched (core alias breakdowns remain for the original ids).
- Authored all 100 ALS base cards in batches (10 diverse first, then 15, 12, 11, 16, 17, 12, 9). Each has clause spans with subject, finite verb and a clause-specific why, parts that rebuild the sentence, order/forms/compare, 1–2 real mistakes with their own reason, a contrast sentence, the meaning of als and why, and an AI-editorial status.
- Replaced the regex `GrammarAlsAnalysis.tsx` with `GrammarClauseMap.tsx`; a card without an authored analysis shows no invented map.
- Dutch-first situations for the 42 ALS cards that had none; replaced 7 that gave the conjunction away ("als", "wanneer") and 1 English scenario that quoted the answer (`situationNl`/`situationEn` overlay, applied in `lib/content/cards.ts`).
- ALS lesson v1.1: checked the toen/als/wanneer and wanneer-register statements against two Taaladvies.net pages (Belgium: toen is the only correct conjunction for one past event), added sections on dan/pas als, negation/er/verb groups and non-conjunction als, two mistakes and two sources. Honest `status` text.
- Interactive children: rewrote the explanations of the 30 existing ALS children (ids and sentences unchanged, so progress is preserved) and replaced 9 Dutch prompts that cued the conjunction; authored 70 new children for seven more parents (pat-als-07, 14, 33, 60, 68, 72 and the linked IT sentence career-troubleshooting-029), each with its own Dutch-first situation and a specific explanation. Result: 100 children on 10 parents.
- Tests: `tests/grammar.als-analysis.test.ts` (14), `tests/grammar.als-children.test.ts` (4), `tests/flashcard-e2e/grammar-als-analysis.spec.ts` (5, at 320/390/1280 px), `tests/flashcard-e2e/grammar-als-journey.spec.ts` (full ALS journey repeated 8× with random card sets, plus Study/Speaking/Quiz at 320/375/430 px with keyboard opening of the analysis). Audit rows A02–A05, A08 and the P1 section updated; counts of lesson versions corrected.

**Evidence (command → result)**
- `npx tsc --noEmit` → clean; `npx eslint lib components tests` → clean.
- `TEST_MONGODB_URI=mongodb://127.0.0.1:27018 npx vitest run` → 50 files, 379 tests passed.
- `E2E_PORT=3100 npm run test:flashcards` → 92 passed. An earlier run had one failure: a stale assumption in `grammar-patterns.spec.ts` (no image in a pattern session) that no longer holds because ALS sessions can contain linked Everyday sentences with pictures; assertion corrected to at most one image.
- NOT RUN: `npm run grammar:release-gate` (expected to fail), `npm run content:review-check`, `npm run test:e2e` (touches Atlas), `npm audit` triage, production offline/prod specs, account two-device sync.

**Counts:** ALS parents 100 (77 authored + 23 linked) = 71 distinct tasks (29 pairs); analyses 100/100; Dutch-first 100/100; interactive children 100 on 10 parents; other topics unchanged (V2 20, Omdat 29, Dat 39, Toen 22, Wanneer 14, Terwijl 12, Voordat/Nadat 24, Tot 20, Verbs 36, Separable 152, Past/perfect 17).

**Open review questions recorded in the data (`openQuestions`):** Flemish participle-first order in 'heb gecontroleerd' (pat-als-68); Flemish order 'niet slapen kan' (pat-als-42, pat-als-66); 'hem' vs 'ze' for 'de zin' (pat-als-64); the pronoun 'die' in main-first 'Ik verbeter die meteen' (pat-als-55); primary gloss of 'Als je afsluiten zegt' (career-clarification-020).

**Known issues / still open for P1**
- [ ] Interactive child variations for the other 90 ALS parents (documented exception until authored; do not fill with templates).
- [ ] ALS journey test extended with a variation toggle on a card that has children, guest/account sync and offline; viewport/keyboard checks beyond the sentence page.
- [ ] Lesson mini self-check; independent native-speaker review of the 100 analyses and prompts.
- [ ] The 29 paired cards inflate the 100-count; consider more distinct tasks before claiming content coverage.

**Next specific task:** extend the ALS journey with the variation toggle and account/offline legs, run the 320/375/430 px and keyboard pass on Study/Speaking/Quiz, then decide with the owner whether to continue ALS children (90 parents left) or start P2 (V2/inversion, Omdat, Dat, Toen, Wanneer to 100 cards each with the same per-card analysis standard).

## 2026-10-26 — Learning-first lesson expansion and review PR

**Scope:** Improve four priority learning topics so learners can study the rules *before* being asked to speak. Continue on the existing `feat/grammar-mastery-phase1` branch, with no change to the main production deployment.

### Changes implemented

- Expanded `inversion`, `omdat`, `dat`, `verbs` topic-wide learning guides.
  - Each now includes 3–5 annotated sentence formulas, at least five why-first teaching sections with three bilingual examples each, and three explicit wrong → right → why corrections.
  - Verb guide explains possession `hebben`, necessity `moeten`, no obligation `hoeven te`, perfect tense `hebben + participle`, and `proberen te`.
  - Covered authentic contrasts `omdat`/ `want`/ `daarom` and `dat` as conjunction versus demonstrative/relative use.
  - Added source links to UCL Dutch grammar and Team Taaladvies Vlaanderen (not independent review of every example).
- GrammarTopicLesson now opens by default for Study; when a learner switches to Speaking/Quiz it remounts collapsed. It remains user-collapsible in any mode.
- Added `tests/grammar.lesson-onboarding.test.ts` checking completeness, verb contrasts and SSR disclosure-state rendering.
- Opened **draft PR #15** against `main` for GitHub Actions checks and explicit review.

### Existing, unmerged feature-branch progress

- **1,200** original core cards protected (600 Everyday + 600 Dutch at Work).
- **432** authored grammar cards, including 77 authored ALS and 152 authored separable-verb cards.
- **53** extra explicitly referenced original cards; ALS total **100 base cards** (77 authored + 23 references).
- **30** interactive child variations across three ALS parent families.
- **52** separable verbs in source inventory; 50 new authored time/conjunction practice cards.
- Detailed ALS and separable lessons already existed on this branch; other topic lessons remain preliminary.
- Do not confuse passive example banks with independently reviewed interactive variations.

### Validation

- **First PR #15 workflow:** deterministic content generation PASS; lint PASS; Next.js type generation PASS; TypeScript FAIL because React `<details>` does not support `defaultOpen`.
- **Fix committed:** switched to `open={opened}` with a React state and `onToggle`; the follow-up workflow passed TypeScript.
- **GitHub Actions run #40361591866 on commit `764ad2bb`:** deterministic source regeneration PASS, ESLint PASS, Next.js type generation PASS, TypeScript PASS, `npm run content:learning-check` PASS, production build PASS (1,706 static pages).
- **Vitest:** 343 passed; seven optional integration tests skipped (CI did not provide the test database).
- **Chromium Playwright:** 4 passed in GitHub Actions (expanded lesson selection, Study→Speaking→Quiz onboarding, reload persistence, original grammar tile regression and French isolation).
- Test thresholds updated to allow naturally concise correct examples.
- New module references are published in the lesson source.
- **Full responsive/manual/cross-device coverage:** NOT DONE in this work session; one mobile-width Playwright check passed, not full cross-browser verification.
- **Independent native speaker review:** NOT DONE.
- **Account/session migration, cross-device, Vercel live checks:** NOT DONE.
- Package installation on CI reported 8 dependency vulnerabilities (3 moderate, 4 high, 1 critical); investigate `npm audit` before release rather than running a blind `npm audit fix --force`.

### Production / rollback

- No files were written to `main`; no version tag created; Vercel tag-only deployment not invoked.
- Branch can be reverted commit-by-commit if validation uncovers problems.
- Do not merge PR #15 or tag a release until declared readiness, security assessment, browser tests and scoped acceptance gates are actually satisfied.

### Next priority

1. Recheck CI after any additional edits; the full required checks passed at commit `764ad2bb`.
2. Extend Playwright coverage beyond the four passing tests: variation toggles, account sync, cross-device and real mobile/responsive behavior.
3. Review ALS grammar scenarios, 30 new children, separable forms, and the added lessons against authoritative sources, recording any corrections.
4. Complete P1 scoped sign-off; only then decide a tested, explicitly scoped learning release versus continued feature expansion.

## 2026-10-26 — Full README/spec audit and honest release-blocking status

**Status: PARTIAL — NOT ACCEPTED FOR MERGE OR PRODUCTION.** The attached master document `DUTCHTAP-GRAMMAR-PLAN-001 v1.0` is the immutable acceptance baseline. The corresponding **25 acceptance rows** are now tracked, with individual evidence and blockers, in `docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md`. That audit currently records **21 PARTIAL, 3 BLOCKED and one narrowly VERIFIED** (Academy frozen-curriculum diff only). Every mandatory required feature is **not** implemented, so a production-ready claim would be false.

### README and documentation corrections

- Replaced the root `README.md` so users and developers can distinguish what already exists on `main` from the unmerged Grammar Mastery branch; documented setup, test limits and tag-only release safety.
- Updated `docs/GRAMMAR-PATTERNS.md` with true playable counts by topic, practice UX, Dutch-first coverage and explicit missing features. Clearly separated 10 passive note examples from 30 tracked children.
- Labeled `docs/GRAMMAR-SOURCE-AUDIT.md` as an initial P0 snapshot, not the current 13-topic inventory. Labeled `docs/learning/README.md` as historical first-release editorial documentation.
- Created the acceptance audit mapping **A01–A25**, P0–P7, numeric shortfalls and release gates with concrete file/test paths. Never adjust the frozen plan's baseline checkboxes to make the app appear finished.

### Code/tests added

- `scripts/check-grammar-acceptance.mjs` + `npm run grammar:release-gate`: **fail closed** unless all 25 acceptance rows have verified status, the report no longer declares itself partial/unapproved, and the table is complete. The command is **expected to exit 1 now**; it is a release-signoff check, not a passing development-CI test. It is not a substitute for independent manual/source evidence.
- `tests/grammar.acceptance-audit.test.ts`: validates 25 audit rows and checks public documentation claims against canonical JSON counts and topic lesson versions.
- `tests/flashcard-e2e/grammar-variation-persistence.spec.ts`: added a focused guest-browser scenario for an ALS one-card session with optional variation toggle, reload, disable/re-enable behavior and preserved parent membership.
- Extended `.github/workflows/grammar-feature-validation.yml` to include the new focused Playwright scenario alongside the previous four.

### Actual data counts cross-checked

- 1,200 original Core cards protected; 432 authored grammar cards + 53 referenced Core aliases = **485** unique grammar base IDs. 1,685 total card IDs across app collections.
- 236/432 authored grammar cards have Dutch-first prompts; 196 do not; 53 Core aliases also lack new Dutch-prompt metadata.
- 30 interactive children on only three ALS parents. 52 distinct separable verb lemmas (below the approved 60–100 target).
- 13 topic lessons: six version 1.0, four version 0.8 and three version 0.2.
- Major open gap: authored grammar cards do not have the structured sentence-level `BREAKDOWNS` that the approved plan demands.

### Verification, limitations and next work

The earlier [full feature CI run #40361591866](https://github.com/EtiDavid/dutchtap/actions/runs/40361591866) passed 343 Vitest tests (7 skipped) and 4 Chromium browser tests, but **that run predates these added documentation and tests**. Check PR #15's current HEAD before reporting the new browser test as passed. The new `grammar:release-gate` is expected to fail while acceptance is incomplete.

**Still required:** complete P1 per-card ALS analyses, language/alternative/variation QA and guest/account/mobile tests; expand all missing targets without cloned filler; multi-topic tagging and uncued mixed retrieval; full security assessment (8 npm audit findings), independent language review, complete regression/migration tests, sign-off and authorized main/tag release. **No merge or production tag performed in this audit.**

## 2026-10-26 — Claude Code implementation handover (documentation only)

**Scope:** Delegate long-form P0–P7 execution to Claude Code while protecting learner pedagogy and existing runtime/session data. No grammar code was newly implemented, no release sign-off occurred and no production deployment was attempted by this handover.

**New files:**
- `docs/CLAUDE-CODE-GRAMMAR-MASTERY-HANDOVER.md`: comprehensive implementation, architectural, Git safety, data/source/typed-schema, test, content-review, session/migration, release and phase-by-phase working contract, with the immediate P1 ALS batch as the first job.
- `docs/CLAUDE-GRAMMAR-TEACHING-EXEMPLARS.md`: mandatory gold-standard explanations for ALS fronted/main-first, omdat/want/daarom, hebben/moeten/hoeven, separable opsturen, toen/als/wanneer, and dat in multiple grammatical functions; no generic explanations.
- Updated root `CLAUDE.md` to make the agent discover and read the approved master plan, exemplars, living A01–A25 audit and work log before edits. Updated README links.

**Repository status seen at handover:** old PR #15 was closed and not merged; source branch `feat/grammar-mastery-phase1` exists, must be fetched/preserved. It is NOT a production-release instruction. The prior A01–A25 acceptance audit remains 21 partial, 3 blocked, one narrowly verified; prior last scope test run was 347 Vitest pass / seven skipped and five focused Playwright pass, not all final tests.

**Next actionable agent work:** Preserve current branch/worktree; create a clean continuation branch; implement reviewable ALS card-specific grammatical data and corresponding UI/testing for 10 diverse actual ALS cards; then complete all 100 in editorial batches and verify the full P1 learning journey before expanding P2–P7. Update audit and worklog after each batch with actual results. Do not promise background activity outside the running Claude Code process.

## 2026-10-26 — Git status reconciliation after handover

**Correction to the immediately previous entry:** GitHub now confirms PR #15 **MERGED into main** at 17:35 UTC (merge commit `892b5303429b1f945fbda40539fa7a76396c4880`). It was initially shown as closed without merge during a short tool-state transition. The old PR's **48 commits are already on main**, but the implementation remains **PARTIALLY COMPLETE** under the A01–A25 audit; a GitHub merge is not pedagogical, editorial or production acceptance.

**Current split:** `main` contains the PR #15 partial Grammar Mastery application foundation. `feat/grammar-mastery-phase1` has additional **documentation-only** commits (Claude handover, worked examples, CLAUDE.md, README, status audit/worklog corrections) not yet in main. A separate docs PR should reconcile this delta, without reapplying already-merged app-code changes. There is no verified version-tag production release for this grammar merge.

**Verified handover:** both long-form docs are accessible on the feature branch; the root CLAUDE.md contains instructions to load them, and the README links them. The next Claude Code agent must fetch fresh Git refs, preserve uncommitted user changes and start a clean continuation branch from main + these handover documents. No further grammar implementation has been claimed in this documentation session.

**Next:** open a documentation-only, non-draft PR for the handover; owner can review/merge this without invoking Vercel because only version tags trigger production. Implementation must still follow P1 → P7 gates.
