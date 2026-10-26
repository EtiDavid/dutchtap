# Grammar Mastery — requirement-by-requirement acceptance audit

**Status: PARTIALLY COMPLETE — NOT MERGE/RELEASE APPROVED**  
**Audit performed:** 26 October 2026  
**Branch/PR:** `feat/grammar-mastery-phase1`, [draft PR #15](https://github.com/EtiDavid/dutchtap/pull/15) against `main`  
**Baseline:** [DUTCHTAP-GRAMMAR-PLAN-001 v1.0](GRAMMAR-MASTERY-MASTER-PLAN.md), §12, remains frozen and authoritative. The baseline's `NOT STARTED` header reflects when it was authored, not the current implementation. **This audit does not change or mark complete the frozen source checklist.**

**Evidence level:** Source/file/structural tests and four browser scenarios were checked in GitHub Actions; this is not a complete human/native-speaker grammar review, full cross-browser evaluation, account-sync migration test, or live production smoke test. Items marked *PARTIAL* may contain working code but are **not acceptance complete**. **VERIFIED** is restricted to narrow facts supported by source/test evidence.

## Measured corpus

| Topic | Legacy authored | New authored | Reused core aliases | Playable total | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| V2/inversion | 20 | 0 | 0 | **20** | 80 short of target 100 |
| Als | 19 | 58 | 23 | **100** | Target count reached; qualitative P1 gate still open |
| Omdat | 20 | 0 | 9 | **29** | 71 short |
| Dat | 20 | 0 | 19 | **39** | 61 short |
| Toen | 20 | 0 | 2 | **22** | 78 short |
| Wanneer | 0 | 14 | 0 | **14** | 86 short |
| Terwijl | 0 | 12 | 0 | **12** | At least 48 short |
| Voordat | 0 | 12 | 0 | **12** | Combined with Nadat: 24/100 |
| Nadat | 0 | 12 | 0 | **12** | Combined with Voordat: 24/100 |
| Tot | 20 | 0 | 0 | **20** | Tot/totdat 60–100 combined target unmet |
| Verbs | 36 | 0 | 0 | **36** | 64 short |
| Separable verbs | 24 | 128 | 0 | **152** | Card count in target range; only 52/60–100 verb lemmas, not native-verified |
| Past & perfect | 17 | 0 | 0 | **17** | 83 short |
| **Total** | **196** | **236** | **53** | **485** | **432 authored; 53 source aliases** |

Other planned sections (`zodra/zolang`, `of` meaning whether, `hoewel/tenzij`, relative clauses, indirect questions, other advanced connectors) are not yet independent complete topic collections. Their presence in existing core sentences or notes **does not count** as a released, tracked new topic.

- **1,200 Core cards** remain in Everyday/Dutch at Work; the branch adds 485 grammar aliases/authored base cards for **1,685 total card IDs**.
- **236 of 432** authored grammar cards include Dutch-first `scenarioNl`; **196 do not**. The **53** aliases inherit original English scenarios and do not yet add Dutch-first metadata.
- **30** independent interactive grammar variations exist across **3** ALS parent families. **482 of 485** grammar parents currently have no complete ten-child variation family. Passive notes/examples do not count.
- **52** separable verb lemma records, all explicitly marked AI-authored / independent review required.
- Topic lesson versions: **6 v1.0** (`als`, `separable`, `inversion`, `omdat`, `dat`, `verbs`), **4 v0.8** (`wanneer`, `terwijl`, `voordat`, `nadat`), **3 v0.2** (`toen`, `tot`, `tense`). A version label is not linguistic certification.
- All 432 authored grammar sentence IDs and Dutch strings are unique within authored grammar JSON; full semantic duplication/translation naturalness audit is outstanding.

**Structural evidence:** `data/grammar-pattern-cards.json`, `data/grammar-reuse-links.json`, `data/grammar-variation-families.json`, `data/editorial/grammar-separable-verbs.json`, `data/grammar-topic-lessons.json`. Counts are derived from the actual branch data rather than passive lesson examples.

## Required §12 A01–A25 audit

| ID | Status | What is implemented / evidence | Remaining acceptance requirement |
| --- | --- | --- | --- |
| **A01** Full topic lesson in all modes | **PARTIAL** | `GrammarTopicLesson.tsx` mounted from `CreateSessionDialog.tsx` and `SessionView.tsx`; Study opens it, Speaking/Quiz close it | Seven topics still only preliminary lessons; verify accessible per-session preference and broader UX |
| **A02** Gold-standard ALS lesson | **PARTIAL** | ALS v1.0 with eight sections, examples, formulas and three mistakes | Fact-check individual assertions and contrasts with reliable Dutch/Flemish sources, independent editorial pass, full P1 journey |
| **A03** Per-sentence structured analysis | **BLOCKED** | `GrammarNotes.tsx` renders `breakdownFor`; ALS has a partial `GrammarAlsAnalysis.tsx` clause view | **432 authored grammar cards have no `BREAKDOWNS` entry** in `lib/grammarBreakdowns.ts`; design and independently review structured clause/finite verb/why/tense/error metadata for each |
| **A04** Mistakes and contrasts | **PARTIAL** | `GrammarErrorRepair.tsx` and topic lesson mistakes; grammatical notes/examples | Only a small set of topic-wide mistakes, not one independently checked specific mistake for each new card |
| **A05** Dutch-first Speaking, English help | **PARTIAL** | `GrammarScenarioPrompt.tsx` conditional `scenarioNl` with toggle, `SpeakingMode.tsx` | 196 authored cards + 53 reused aliases still have no Dutch-first prompt; review prompts for leakage and scenario/answer fit |
| **A06** Accepted alternative answers | **PARTIAL** | `communication.ts` registers two clause orders for 58 new ALS cards, `tests/grammar.alternatives.test.ts` | No equivalent systematic authored alternatives for other grammar topics, per-model explanatory QA and typed responses |
| **A07** Quiz feedback / error correction | **PARTIAL** | `QuizMode.tsx` tiles, `GrammarErrorRepair.tsx` independent unscored correction mode | Full sentence-specific feedback per new grammar card, optional typed response inside grammar sessions, more contextual error challenges |
| **A08** Interactive variations | **PARTIAL** | `lib/variations/content.ts`, `VariationPractice.tsx`, 3 families × 10 children; `tests/grammar.variations.test.ts` | 482 remaining base parents lack complete variation family; verify toggle, unlock, independent progress and sync in full browser test |
| **A09** Multi-topic referenced core cards | **PARTIAL** | 53 explicit aliases with stable source references and independent grammar rating, `tests/grammar.reuse.test.ts` | One source across several approved grammar tags, deduplicated topic index, cross-topic skill identity and comprehensive source tagging |
| **A10** Fixed sessions / eligible count | **PARTIAL** | `lib/sessions/engine.ts` retains card IDs, levels, max 100 and max five sessions; unit tests and first browser scenarios | End-to-end linked Core selection, all modes, historical restore and cross-device account flow across full scope |
| **A11** Accurate skill/child mastery | **PARTIAL** | Reference aliases have separate levels; child progress separate | Per-pattern/multi-topic mastery not yet modeled; prevent false cross-skill mastery awards |
| **A12** Card targets | **PARTIAL** | ALS 100 and separable 152; all other exact shortfalls above | Expand/reuse only correctly targeted meaningful cards; major topic and advanced targets remain far short |
| **A13** Extended clauses and contrasts | **PARTIAL** | Added `wanneer`, `terwijl`, `voordat`, `nadat` small decks and lessons | `zodra`, `zolang`, indirect `of`, relative pronouns, `hoewel`, `tenzij`, `ook al`, broader causal/conditional contrasts not complete |
| **A14** 60–100 separable verbs, 150–200 cards | **PARTIAL** | 52 authored lemma records + 152 base cards | At least eight more useful verified lemmas; individual form, preposition and natural-usage QA |
| **A15** Full separable-form teaching | **PARTIAL** | Separable v1 lesson includes 6 formulas; `grammar-separable-cards.json` forms | Individually audit tense, auxiliary, `te`, modal, subordinate/imperative and inseparable contrasts across representative verbs |
| **A16** Uncued mixed grammar | **BLOCKED** | Legacy `/learn` Think in Dutch remains; single-topic grammar tile drills exist | Progressive, uncued cross-topic retrieval in shared engine with prerequisite/review scheduling not delivered |
| **A17** Natural Dutch and provenance | **PARTIAL** | Authored cards have AI-editorial `review` markers, source records say independent native review required | Per-card model/scenario/translation/alternative/child editorial verification, provenance hashes and independent review where claimed |
| **A18** Deterministic generation, ID safety, coverage | **PARTIAL** | `scripts/build-grammar-patterns.py` deterministic check passed; original ID and exact authored-text uniqueness tests exist | Comprehensive duplicate/semantic near-duplicate analysis, multi-tag review, coverage matrix, and exact source/card metadata audit |
| **A19** Session/history/account/offline | **PARTIAL** | Existing reducer/storage reused; scoped Playwright reload test passed | Historical-session fixtures, account two-device sync, variation state replay, offline resume and rollback full tests |
| **A20** French and other games | **PARTIAL** | French grammar selection excluded; one grammar-focused French isolation browser test passed; baseline games unchanged in diff | Broader regression browser pass against actual old sessions and existing games |
| **A21** Accessibility, voice and mobile | **PARTIAL** | Semantic details/button controls; native device speech; one 390 px overflow assertion passed | Full 320/375/430 px/tablet, keyboard/screen reader, reduced motion, Dutch Belgian voice selection and offline tests |
| **A22** Tests and build | **PARTIAL** | [CI run #40361591866](https://github.com/EtiDavid/dutchtap/actions/runs/40361591866): deterministic regeneration/lint/typegen/TypeScript/content learning check/build PASS; **343 Vitest pass (7 skipped), 4 focused Chromium pass** | Full suite including variation E2E, real DB sync, content review, accessibility, release/manual tests; recheck final HEAD |
| **A23** Documentation / rollback | **PARTIAL** | This audit, updated root README, Grammar Patterns guide, worklog; `docs/DEPLOYMENT.md` for tag-only deploy | Refresh remaining historical docs, formal migration and rollback drill and full source-specific provenance |
| **A24** Frozen Academy curriculum | **VERIFIED for code diff only** | No separate Academy curriculum file changed by PR #15; `docs/GRAMMAR-MASTERY-MASTER-PLAN.md` explicitly forbids modifying it | Continue to enforce on later changes; this does **not** certify the rest of the app |
| **A25** Independent final review | **BLOCKED** | This audit records all 25 statuses and missing work | A separate independent final review of implementation, editorial grammar, regression evidence and release gates; not performed |

## Scope and priority gates

### P0 — inventory/design: PARTIAL
Original corpus and initial Core search candidates documented in `docs/GRAMMAR-SOURCE-AUDIT.md`; 53 manual core aliases. The full formal tagging/schema/migration review and coverage verification are open.

### P1 — complete ALS experience: PARTIAL
100 distinct ALS parent cards exist. The detailed lesson, 58 new paired alternatives, Dutch prompts on these 58, initial 30 child variations and focused browser flow work. **P1 gate fails** until all P1 card-level breakdowns/editorial checks, variations/compatibility expectations, desktop/mobile, browser persistence and account/guest sync are demonstrated; first passing browser subset is not complete evidence.

### P2–P5 — full curriculum, verbs, extended clauses and mixed practice: PARTIAL/BLOCKED
Most volume targets are unmet. Multitopic skill index and intelligent uncued mixed practice do not exist as requested. No claim of full grammar mastery curriculum is justified.

### P6 — polish and compatibility: PARTIAL
First scoped mobile browser checks pass; full device/keyboard/accessible audio/offline compatibility not verified.

### P7 — independent audit and release: BLOCKED
25-item independent acceptance, native-language review, security audit, rollout/recovery checks and full test suite are open. **Do not merge to `main` or push a production `v*` tag.**

## Tests and deployment evidence

- Last fully checked feature commit: `764ad2bb`; run 40361591866: **343 Vitest passed / 7 skipped; 4 Chromium tests passed; deterministic generation, lint, type checking, learning-content check and build passed.**
- New documentation-only commits are not substitutes for fresh CI on the latest head. Current exact build/CI status belongs to PR #15.
- Historical `npm run content:review-check` is an additional editorial gate and not equivalent to `content:learning-check`; don't claim it passed without command output.
- An earlier `npm ci` run reported eight dependency audit vulnerabilities (three moderate, four high, one critical). **Root cause/production applicability/mitigation not yet verified.** Investigate before release; do not run a blind `npm audit fix --force`.
- No `main` merge, production tag, production release or successful live smoke test for the new grammar branch has been made.

## Next acceptance tasks, in priority order

1. **P1 structured per-card grammar explanation** with explicit clause segmentation/finite verbs/mistakes/why for all 100 ALS base cards; preserve references and exact IDs; no false regex parser over unreviewed sentences.
2. Complete ALS prompts/review/extra children and full end-to-end guest + signed-in + offline + restore checks, not just four browser tests.
3. Expand/reuse targeted content with real independent checks (V2, omdat, dat, toen, wanneer, verb tense and separables), add meaningful Dutch-first situations and alternatives; never inflate counts with repeated templates.
4. Add justified multi-topic tags/mastery and uncued mixed Think in Dutch, independent progress, and coverage tests.
5. Re-run full regressions, `npm run content:review-check`, security analysis and manual accessibility; obtain independent review and update all §12 items with proof. Only then merge/tag.
