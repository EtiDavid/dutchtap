# Grammar Mastery — requirement-by-requirement acceptance audit

**Status: PARTIALLY COMPLETE — NOT MERGE/RELEASE APPROVED for further feature changes or production**  
**Audit performed:** 26 October 2026  
**Git state:** [PR #15](https://github.com/EtiDavid/dutchtap/pull/15) MERGED into main at 2026-10-26 17:35 UTC (merge SHA 892b5303) despite this *partial* acceptance status. Subsequent Claude Code handover docs are on `feat/grammar-mastery-phase1` until merged separately. **Production release not verified.**  
**Baseline:** [DUTCHTAP-GRAMMAR-PLAN-001 v1.0](GRAMMAR-MASTERY-MASTER-PLAN.md), §12, remains frozen and authoritative. The baseline's `NOT STARTED` header reflects when it was authored, not the current implementation. **This audit does not change or mark complete the frozen source checklist.**

**Evidence level:** Source/file/structural tests and four browser scenarios were checked in GitHub Actions; this is not a complete human/native-speaker grammar review, full cross-browser evaluation, account-sync migration test, or live production smoke test. Items marked *PARTIAL* may contain working code but are **not acceptance complete**. **VERIFIED** is restricted to narrow facts supported by source/test evidence.

## Measured corpus

| Topic | Legacy authored | New authored | Reused core aliases | Playable total | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| V2/inversion | 20 | 42 | 38 | **100** | Target count met; fronted time, place, attitude, object, predicate and prepositional phrases (single main clauses, not conjunction clauses); 38 core sentences linked; every card has a hand-authored analysis |
| Als | 19 | 58 | 23 | **100** | Target count reached; qualitative P1 gate still open |
| Omdat | 20 | 71 | 9 | **100** | Target count met; 8 of the 71 are want-contrast cards, and every card has a hand-authored analysis |
| Dat | 20 | 44 | 36 | **100** | Target count met; 44 new report/fronted/negated/question/relative cards and 17 further source aliases, and every card has a hand-authored analysis |
| Toen | 20 | 78 | 2 | **100** | Target count met; only two core sentences use the conjunction, so 78 new cards (first, after, past perfect, perfect, adverb `toen` = then, questions, periods, negated/modal); every card has a hand-authored analysis |
| Wanneer | 0 | 88 | 12 | **100** | Target count met; 12 further core questions/clauses linked, 74 new cards (time clauses before/after, direct and indirect questions, repeated past, perfect); every card has a hand-authored analysis |
| Terwijl | 0 | 59 | 1 | **60** | Target count met (60–100); simultaneous action (main clause first or second), perfect/past/passive/modal/separable verbs inside the clause, contrast (whereas), concession (even though), questions, imperatives, and the neighbours `tijdens` (preposition), `intussen`/`ondertussen` (adverbs); every card has a hand-authored analysis |
| Voordat | 0 | 40 | 10 | **50** | Combined with Nadat: 62/100; clause first/second, modal/perfect/past perfect/separable, imperatives, questions, negation, `voor` (preposition), `daarvoor`/`eerst` (adverbs); every card has a hand-authored analysis |
| Nadat | 0 | 50 | 0 | **50** | Target met with Voordat: 100/100 combined; past perfect, perfect with hebben/zijn, separable participles, clause first/second, modals, imperatives, questions, negation, `na` (preposition), `daarna`/`vervolgens` (adverbs); every card has a hand-authored analysis |
| Tot | 20 | 29 | 11 | **60** | Target count met (60–100); conjunction `tot`/`totdat`, prepositional `tot` (time, day, place, `tot aan`), `tot nu toe`, `van … tot`, and fixed combinations (`toegang tot`, `leiden tot`, `zich wenden tot`, `promoveren tot`); every card has a hand-authored analysis |
| Zodra & zolang | 0 | 49 | 11 | **60** | New topic `zodra`; target count met (60 combined); trigger (`zodra`) versus period/condition (`zolang`), perfect/past/passive/modal/separable inside the clause, negation, imperatives, questions, `zo lang als`, and the neighbours `meteen`, `direct na`, `voorlopig`, `tot dan`; every card has a hand-authored analysis |
| Of | 0 | 48 | 12 | **60** | New topic `of`; target count met (60); `of` = whether in embedded yes/no questions with verb groups, tenses and fronted clauses, contrast `dat`/`of`, `of` = or between options, `of ... of niet`, `het maakt niet uit of`, `alsof`; every card has a hand-authored analysis |
| Verbs | 36 | 64 | 0 | **100** | Target count met; modals, hoeven + te, te-infinitive verbs, hebben, inseparable verbs, fixed prepositions, reflexive verbs and infinitive groups; every card has a hand-authored analysis |
| Separable verbs | 24 | 160 | 0 | **184** | Card count in target range; 68 verb lemmas in the dictionary (60–100 target met by count), each with an authored forms table; not native-verified |
| Past & perfect | 17 | 83 | 0 | **100** | Target count met; present, simple past (weak and strong), perfect with hebben and zijn, prefix verbs without ge-, modal perfect, perfect in dependent clauses, past perfect and perfect questions; every card has a hand-authored analysis with the auxiliary rationale |
| **Total** | **196** | **963** | **165** | **1,324** | **1159 authored; 165 source aliases** |

Other planned sections (`hoewel/tenzij`, relative clauses, indirect questions, other advanced connectors) are not yet independent complete topic collections. Their presence in existing core sentences or notes **does not count** as a released, tracked new topic.

- **1,200 Core cards** remain in Everyday/Dutch at Work; the branch adds 1,324 grammar aliases/authored base cards for **2,524 total card IDs**.
- **963 of 1159** authored grammar cards include Dutch-first `scenarioNl`; **196 do not**. The **165** aliases inherit original English scenarios and do not yet add Dutch-first metadata.
- **100** independent interactive grammar variations exist across **10** ALS parent families. **1314 of 1324** grammar parents currently have no complete ten-child variation family. Passive notes/examples do not count.
- **68** separable verb lemma records, all explicitly marked AI-authored / independent review required.
- Topic lesson versions: **3 v1.0** (`inversion`, `omdat`, `dat`), **12 v1.1** (`als`, `toen`, `wanneer`, `separable`, `tense`, `verbs`, `tot`, `terwijl`, `voordat`, `nadat`, `zodra`, `of`), **0 v0.8**, **0 v0.2**. A version label is not linguistic certification.
- All 1159 authored grammar sentence IDs and Dutch strings are unique within authored grammar JSON; full semantic duplication/translation naturalness audit is outstanding.

**Structural evidence:** `data/grammar-pattern-cards.json`, `data/grammar-reuse-links.json`, `data/grammar-variation-families.json`, `data/editorial/grammar-separable-verbs.json`, `data/grammar-topic-lessons.json`. Counts are derived from the actual branch data rather than passive lesson examples.

## Required §12 A01–A25 audit

| ID | Status | What is implemented / evidence | Remaining acceptance requirement |
| --- | --- | --- | --- |
| **A01** Full topic lesson in all modes | **PARTIAL** | `GrammarTopicLesson.tsx` mounted from `CreateSessionDialog.tsx` and `SessionView.tsx`; Study opens it, Speaking/Quiz close it | Seven topics still only preliminary lessons; verify accessible per-session preference and broader UX |
| **A02** Gold-standard ALS lesson | **PARTIAL** | ALS lesson v1.1: eleven sections (meaning, subordinate order, inversion, tenses, als/wanneer/toen, clusters, separables, dan/pas als, negation/er, non-conjunction als), formulas and five mistakes. The toen / als / wanneer and wanneer-register statements, and the Belgian note that toen is the correct conjunction for one past event, were checked against two Taaladvies.net pages on 26 October 2026 (`data/grammar-topic-lessons.json`) | Other assertions not independently sourced; no mini self-check yet; independent native editorial pass; full P1 journey |
| **A03** Per-sentence structured analysis | **PARTIAL** | **All 100 ALS base cards** (77 authored + 23 linked Everyday/Work sentences) have a hand-authored analysis in `data/grammar-als-analysis.json`: clause spans, subject and finite verb per clause with why, parts that rebuild the sentence, order/forms/compare, one or two real mistakes, a main-first/fronted contrast and the meaning of als. Rendered by `GrammarClauseMap.tsx` through `breakdownFor`; the regex view was removed. `tests/grammar.als-analysis.test.ts` (14 tests) checks spans, finite verbs, corrections, uniqueness and coverage | The other 332 authored grammar cards (and all non-ALS topics) still have no analysis; every ALS analysis is AI-editorial only; 3 records carry open questions for a native reviewer |
| **A04** Mistakes and contrasts | **PARTIAL** | Topic-lesson mistakes, `GrammarErrorRepair.tsx`, and for ALS a specific wrong → right → why (1–2 per card) and a contrast sentence for each of the 100 base cards | Non-ALS topics only have topic-wide mistakes; mistakes are AI-authored, not independently checked |
| **A05** Dutch-first Speaking, English help | **PARTIAL** | `GrammarScenarioPrompt.tsx`; all 100 ALS cards now have a Dutch-first situation (58 existing, 42 added in the analysis overlay) and none contains als, wanneer, zodra or toen; 7 prompts that gave the conjunction away were replaced; 1 English scenario that quoted the answer was rewritten | 196 authored cards outside ALS + 53−23 other aliases have no Dutch-first prompt; review of prompt/answer fit is AI-only |
| **A06** Accepted alternative answers | **PARTIAL** | `communication.ts` registers two clause orders for 58 new ALS cards, `tests/grammar.alternatives.test.ts` | No equivalent systematic authored alternatives for other grammar topics, per-model explanatory QA and typed responses |
| **A07** Quiz feedback / error correction | **PARTIAL** | `QuizMode.tsx` tiles, `GrammarErrorRepair.tsx` independent unscored correction mode | Full sentence-specific feedback per new grammar card, optional typed response inside grammar sessions, more contextual error challenges |
| **A08** Interactive variations | **PARTIAL** | `lib/variations/content.ts`, `VariationPractice.tsx`, 10 families × 10 children (the original three were rewritten with specific explanations and conjunction-free Dutch prompts); `tests/grammar.variations.test.ts`, `tests/grammar.als-children.test.ts` | 475 remaining base parents lack complete variation family; verify toggle, unlock, independent progress and sync in full browser test |
| **A09** Multi-topic referenced core cards | **PARTIAL** | 53 explicit aliases with stable source references and independent grammar rating, `tests/grammar.reuse.test.ts` | One source across several approved grammar tags, deduplicated topic index, cross-topic skill identity and comprehensive source tagging |
| **A10** Fixed sessions / eligible count | **PARTIAL** | `lib/sessions/engine.ts` retains card IDs, levels, max 100 and max five sessions; unit tests and first browser scenarios | End-to-end linked Core selection, all modes, historical restore and cross-device account flow across full scope |
| **A11** Accurate skill/child mastery | **PARTIAL** | Reference aliases have separate levels; child progress separate | Per-pattern/multi-topic mastery not yet modeled; prevent false cross-skill mastery awards |
| **A12** Card targets | **PARTIAL** | ALS 100 and separable 184; all other exact shortfalls above | Expand/reuse only correctly targeted meaningful cards; major topic and advanced targets remain far short |
| **A13** Extended clauses and contrasts | **PARTIAL** | Added `wanneer`, `terwijl`, `voordat`, `nadat` small decks and lessons | `zodra`, `zolang`, indirect `of`, relative pronouns, `hoewel`, `tenzij`, `ook al`, broader causal/conditional contrasts not complete |
| **A14** 60–100 separable verbs, 150–200 cards | **PARTIAL** | 68 authored lemma records (8 of them only had the original three-card sets before this batch) + 184 base cards (8 imperative cards added); `data/grammar-separable-forms.json` has per-verb forms (infinitive, main clause, simple past, perfect with auxiliary, modal, te + infinitive, dependent clause, imperative, preposition) shown on the sentence page | At least eight more useful verified lemmas; individual form, preposition and natural-usage QA |
| **A15** Full separable-form teaching | **PARTIAL** | Separable v1 lesson includes 6 formulas; `data/grammar-separable-forms.json` (68 verbs, forms table on the sentence page); hand-authored analysis for all 184 separable cards (`data/grammar-separable-analysis.json`: split, joined and dependent-clause patterns, mistakes, contrast, Dutch-first prompt for the original 24) | Individually audit tense, auxiliary, `te`, modal, subordinate/imperative and inseparable contrasts across representative verbs |
| **A16** Uncued mixed grammar | **BLOCKED** | Legacy `/learn` Think in Dutch remains; single-topic grammar tile drills exist | Progressive, uncued cross-topic retrieval in shared engine with prerequisite/review scheduling not delivered |
| **A17** Natural Dutch and provenance | **PARTIAL** | Authored cards have AI-editorial `review` markers, source records say independent native review required | Per-card model/scenario/translation/alternative/child editorial verification, provenance hashes and independent review where claimed |
| **A18** Deterministic generation, ID safety, coverage | **PARTIAL** | `scripts/build-grammar-patterns.py` deterministic check passed; original ID and exact authored-text uniqueness tests exist | Comprehensive duplicate/semantic near-duplicate analysis, multi-tag review, coverage matrix, and exact source/card metadata audit |
| **A19** Session/history/account/offline | **PARTIAL** | Existing reducer/storage reused; scoped Playwright reload test passed | Historical-session fixtures, account two-device sync, variation state replay, offline resume and rollback full tests |
| **A20** French and other games | **PARTIAL** | French grammar selection excluded; one grammar-focused French isolation browser test passed; baseline games unchanged in diff | Broader regression browser pass against actual old sessions and existing games |
| **A21** Accessibility, voice and mobile | **PARTIAL** | Semantic details/button controls; native device speech; one 390 px overflow assertion passed | Full 320/375/430 px/tablet, keyboard/screen reader, reduced motion, Dutch Belgian voice selection and offline tests |
| **A22** Tests and build | **PARTIAL** | [CI run #40367520391](https://github.com/EtiDavid/dutchtap/actions/runs/40367520391): deterministic regeneration/lint/typegen/TypeScript/content learning check/build PASS; **346 Vitest pass (7 skipped), 5 focused Chromium pass**, including ALS variation-toggle guest persistence | Full suite including variation E2E, real DB sync, content review, accessibility, release/manual tests; recheck final HEAD |
| **A23** Documentation / rollback | **PARTIAL** | This audit, updated root README, Grammar Patterns guide, worklog; `docs/DEPLOYMENT.md` for tag-only deploy | Refresh remaining historical docs, formal migration and rollback drill and full source-specific provenance |
| **A24** Frozen Academy curriculum | **VERIFIED for code diff only** | No separate Academy curriculum file changed by PR #15; `docs/GRAMMAR-MASTERY-MASTER-PLAN.md` explicitly forbids modifying it | Continue to enforce on later changes; this does **not** certify the rest of the app |
| **A25** Independent final review | **BLOCKED** | This audit records all 25 statuses and missing work | A separate independent final review of implementation, editorial grammar, regression evidence and release gates; not performed |

## Scope and priority gates

### P0 — inventory/design: PARTIAL
Original corpus and initial Core search candidates documented in `docs/GRAMMAR-SOURCE-AUDIT.md`; 53 manual core aliases. The full formal tagging/schema/migration review and coverage verification are open.

### P1 — complete ALS experience: PARTIAL
100 distinct ALS parent cards exist (but see the note on pairs below). Done and tested: the ALS lesson v1.1 (fact-checked against Taaladvies for toen/als/wanneer), a hand-authored per-sentence analysis for all 100 base cards, a Dutch-first situation for all 100 without a conjunction leak, a clause-map view that replaces the regex guess, and 58 paired alternative clause orders. **Still open for the P1 gate:** only 10 parents have interactive child variations (100 children; 90 parents have none), the browser journey (select 10 → study → speak → quiz → reload) now passes for ALS cards but the variation-toggle, account-sync and offline legs have not been run for them, 320/375/430 px and keyboard/screen-reader checks cover only the sentence page, there is no mini self-check in the lesson, and nothing has had independent native review.

**Honest count note:** 58 of the 100 ALS cards are 29 pairs that say the same thing once with the condition first and once with the main clause first. They are useful for drilling inversion, but there are only **71 distinct communicative tasks** (19 legacy + 29 pairs + 23 linked sentences).

### P2–P5 — full curriculum, verbs, extended clauses and mixed practice: PARTIAL/BLOCKED
Most volume targets are unmet. Multitopic skill index and intelligent uncued mixed practice do not exist as requested. No claim of full grammar mastery curriculum is justified.

### P6 — polish and compatibility: PARTIAL
First scoped mobile browser checks pass; full device/keyboard/accessible audio/offline compatibility not verified.

### P7 — independent audit and release: BLOCKED
25-item independent acceptance, native-language review, security audit, rollout/recovery checks and full test suite are open. **PR #15 was merged, but it did not satisfy full acceptance. Do not merge further incomplete implementation work or push a production `v*` tag without the required sign-offs.**

## Tests and deployment evidence

- Later fully checked feature commit: `b44d4edc`; [run 40367520391](https://github.com/EtiDavid/dutchtap/actions/runs/40367520391): **346 Vitest passed / 7 skipped; 5 Chromium tests passed; deterministic generation, lint, type checking, learning-content check and build passed.**
- New documentation-only commits are not substitutes for fresh CI on the latest head. Current exact build/CI status belongs to PR #15.
- Historical `npm run content:review-check` is an additional editorial gate and not equivalent to `content:learning-check`; don't claim it passed without command output.
- An earlier `npm ci` run reported eight dependency audit vulnerabilities (three moderate, four high, one critical). **Root cause/production applicability/mitigation not yet verified.** Investigate before release; do not run a blind `npm audit fix --force`.
- **GitHub merge already occurred:** PR #15 was merged into `main` on 26 October 2026; this is NOT evidence of A01–A25 completion. No production tag/release or successful live smoke test for this grammar foundation was verified during this audit. Edit this paragraph after verifying new deployment evidence.

## Next acceptance tasks, in priority order

1. **P1 structured per-card grammar explanation** with explicit clause segmentation/finite verbs/mistakes/why for all 100 ALS base cards; preserve references and exact IDs; no false regex parser over unreviewed sentences.
2. Complete ALS prompts/review/extra children and full end-to-end guest + signed-in + offline + restore checks, not just four browser tests.
3. Expand/reuse targeted content with real independent checks (V2, omdat, dat, toen, wanneer, verb tense and separables), add meaningful Dutch-first situations and alternatives; never inflate counts with repeated templates.
4. Add justified multi-topic tags/mastery and uncued mixed Think in Dutch, independent progress, and coverage tests.
5. Re-run full regressions, `npm run content:review-check`, security analysis and manual accessibility; obtain independent review and update all §12 items with proof. Only then merge/tag.
