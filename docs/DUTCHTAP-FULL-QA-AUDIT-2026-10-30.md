# DutchTap — application, grammar, audio and release QA audit

**Audit date:** 30 October 2026  
**Baseline inspected:** GitHub main after audio PR #25; grammar acceptance audit dated 28 October; PR #26 remains a separate, unmerged test-only correction at audit time.  
**Verdict:** **FUNCTIONAL WITH MATERIAL ACCEPTANCE GAPS — NOT FULL GRAMMAR-MASTERY SIGN-OFF.**  
**Nature of evidence:** repository/source inspection, full JSON inventory checks where stated, developer-run automated tests, and a fresh-browser **guest-only** live-site smoke test. No independent native-Dutch review, authenticated two-device test, full security review or human screen-reader certification.

## Executive findings

1. **Browser regression fixes are demonstrated but not yet merged.** The repository owner ran Playwright on PR #26: **177/177 flashcard tests** and **4/4 production/offline tests** passed. PR #26 changes exactly three test files and is separate from this audit. Do not present a green PR branch as a successful main-branch run until the PR is merged and rechecked.
2. **Core grammar quantity is substantial.** Main contains **1,506 authored grammar cards + 184 reused-card aliases = 1,690 playable grammar base IDs across 21 topics**. There are **68 separable-verb lemma/form tables**, **61 mixed-grammar challenges**, **100 authored ALS variation children**, and **21 topic guides**.
3. **Structural grammar analyses exist, but editorial quality is not certified.** All 21 grammar-analysis JSON files were inspected: their 1,690 records have nonempty clauses, parts, mistakes, order, forms and comparison fields in the structural spot-check. All 1,506 authored grammar cards declare AI editorial review; **zero** declare independent human review. Structural completeness is not proof of naturally spoken Belgian Dutch or faithful scenario/translation.
4. **The 834 indexed Flemish MP3s do not cover 834 separate base cards.** Exact-text/static-path source analysis gives only **747/2,890 playable base cards (25.8%) with a recorded audio path** (600 original Everyday, 3 Workplace, 110 authored grammar, 34 reused grammar aliases). Other cards use device TTS, intentionally. The 834 index also includes Learning Hub prompts, verb forms, reviewed answer alternatives and vocabulary.
5. **Recorded audio is sparse in grammar expansion.** Only **110/1,506 (7.3%)** authored grammar cards, **19/480 (4.0%)** topic-lesson examples and **0/100** explicitly authored ALS interactive variation children match the new index exactly. These are coverage gaps, **not proof that the audio buttons are broken**.
6. **Production guest navigation works in a scoped smoke test.** A new guest browser selected Nederlands, created a 10-card session, opened Study/Speaking/Quiz, manipulated word tiles and loaded Vocabulary and Mixed Grammar. Audio controls were visible; auditory quality, full scoring, signed-in persistence and 21-topic manual walkthroughs were **not** verified by that smoke test.
7. **Release and teaching-quality gates remain open.** The approved master plan's A01–A25 acceptance matrix has **23 PARTIAL**, **one VERIFIED only for narrow code-diff preservation (A24)** and **one BLOCKED (A25 independent final review)** according to the maintained acceptance audit. The grammar release gate is intentionally failing until requirements are actually satisfied.

## 1. Reproducible evidence and scope

Sources inspected:
- docs/GRAMMAR-MASTERY-MASTER-PLAN.md, especially sections 4, 5.3, 7.4, 8 and frozen A01–A25 in section 12;
- docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md (28 October; status/evidence and outstanding work);
- data/grammar-pattern-cards.json (1,506 authored), data/grammar-reuse-links.json (184), 21 data/grammar-*-analysis.json files (1,690 analysis entries), data/grammar-topic-lessons.json, data/grammar-variation-families.json, data/grammar-mixed-challenges.json and data/grammar-separable-forms.json;
- data/audio-index.json, the 600 Everyday records in three JSON files, 600 Workplace records, lib/flashcards/engine.ts, lib/content/cards.ts, lib/speech/playback.ts, lib/speech/recordings.ts, components/sessions/CardParts.tsx and the audio export script;
- tests/flashcard-e2e/communication.spec.ts, variations.spec.ts, tests/prod-e2e/offline-grammar.spec.ts, public/sw.js, playwright.*.config.ts and tests/e2e/global-teardown.ts;
- README.md and docs/DEPLOYMENT.md.

**Evidence categories:** INSPECTED = file/data/source read, OBSERVED = owner-provided test output or live browser smoke test, NOT RUN = requires separate environment/human evaluation. The new script scripts/audit-recorded-audio.mjs was added for **local reproduction**; the counts below were independently computed from GitHub files during this audit, but this new script itself has **not yet been executed in the owner's repository**.

### Browser evidence (OBSERVED)

| Suite | Result | Caveat |
| --- | --- | --- |
| Flashcards Playwright on PR #26 | 177 passed, 0 failed | Owner ran locally, not a fresh main CI run |
| Production/offline Playwright on PR #26 | 4 passed, 0 failed | Exercises offline navigation with test fixtures |
| Earlier npm test / npm run build | Passed (owner report) | Earlier run, do not infer complete account E2E |
| npm run test:e2e with Atlas accounts | NOT RUN | Destructive teardown; see safety below |
| Native-speaker editorial validation | NOT RUN | Mandatory before final curriculum sign-off |
| Human screen-reader/mobile acceptance | NOT RUN | Axe/viewport automated results are insufficient |

The three previously failing Playwright cases were two **outdated expectations** of device TTS despite newly available exact MP3s, and one **ambiguous nested summary locator**. PR #26 corrects the tests while preserving behavior; after changes, 181 tests passed.

### Live guest smoke test (OBSERVED, limited)

A fresh browser visited https://dutchtap.davideti.dev, selected Dutch, created a 10-card guest session, navigated to Study, Speaking and Quiz, found Listen/Listen slowly/Stop, manipulated quiz word tiles, and opened the vocabulary and mixed grammar pages. No visible page error was encountered along the tested path. This is **not** a scored quiz completion, audio listening verification, offline test or account sync test.

## 2. Grammar curriculum inventory (INSPECTED)

The topic counts below distinguish authored grammar cards from aliases of previously existing Core cards. Counts meet the plan's numerical quotas; numbers alone do not establish pedagogical variety.

| Topic | Authored | Reused aliases | Base total | Authored with new MP3 |
| --- | ---: | ---: | ---: | ---: |
| Inversion/V2 | 62 | 38 | 100 | 6 |
| Als | 77 | 23 | 100 | 6 |
| Omdat | 91 | 9 | 100 | 7 |
| Dat | 64 | 36 | 100 | 6 |
| Toen | 98 | 2 | 100 | 6 |
| Wanneer | 88 | 12 | 100 | 0 |
| Terwijl | 59 | 1 | 60 | 0 |
| Voordat | 40 | 10 | 50 | 0 |
| Nadat | 50 | 0 | 50 | 0 |
| Tot | 49 | 11 | 60 | 6 |
| Zodra/Zolang | 49 | 11 | 60 | 1 |
| Of | 48 | 12 | 60 | 0 |
| Hoewel/Tenzij | 59 | 1 | 60 | 0 |
| Indirect questions | 85 | 15 | 100 | 0 |
| Relative clauses | 97 | 3 | 100 | 0 |
| More connectors | 40 | 0 | 40 | 0 |
| Despite/without/except | 36 | 0 | 36 | 0 |
| Daar/Stel dat/Zoals | 30 | 0 | 30 | 0 |
| Verb constructions | 100 | 0 | 100 | 37 |
| Separable verbs | 184 | 0 | 184 | 24 |
| Past & perfect | 100 | 0 | 100 | 11 |
| **Total** | **1,506** | **184** | **1,690** | **110** |

**Analyses:** 21 data files collectively contain **1,690 keyed records**, and no record lacked the checked structural fields (clauses, parts, mistakes, order, forms, comparison). This is a nonempty-field check rather than an independent line-by-line linguistic validation. The source IDs and authored texts are unique within the 1,506-card authored array.

**Topic lessons:** 21/21 have formulas, sections, examples, mistakes and at least one source link. Three topic revisions remain v1.0 (inversion, omdat, dat), while 18 are v1.1. Current separable-verb lesson has **two listed source links**, despite older acceptance-audit text saying it had none; the audit documentation should be reconciled with current JSON rather than copied forward unchanged.

**Variations:** The ten explicitly authored ALS families contain 100 children. Existing analysis-contrast logic exposes further runtime children where meaning matches, documented as 26 in the 28 October acceptance audit. Most of the 1,690 grammar parents still lack separately authored, independently reviewed variation families. Do **not** add filler variations simply to reach ten per parent.

**Quality / teaching contract:** Scenario, intended Dutch answer, English gloss, word-order explanation, tense/auxiliary rationale, negative examples, accepted alternatives and contextual suitability still require independent review. Automated coverage checks cannot detect every plausible-but-wrong Dutch form or misleading translation. Prior same-AI sample review of 84 cards found defects, supporting a targeted human review rather than a blanket "all accurate" declaration.

## 3. Audio assets versus practical coverage (INSPECTED)

The new index has **834 Dutch-language entries**. The app chooses an explicit legacy MP3 first, then an exact text-matched index entry, then a device voice. This is the documented behavior of lib/speech/playback.ts. Consequently, "834 audio clips" **cannot** be interpreted as "834 grammar base cards now have audio."

| Actual learner surface | Total | Recorded | Device fallback / not matched |
| --- | ---: | ---: | ---: |
| Everyday base cards (legacy recordings) | 600 | 600 | 0 |
| Workplace base cards | 600 | 3 | 597 |
| Authored grammar base cards | 1,506 | 110 | 1,396 |
| Reused grammar aliases | 184 | 34 | 150 |
| **All base card IDs** | **2,890** | **747** | **2,143** |
| Explicitly authored grammar children | 100 | 0 | 100 |
| Lesson example sentences | 480 | 19 | 461 |

**Important accounting:** Aliases are independent practice IDs; 33 of 34 recorded aliases reuse legacy Everyday audio, one matches indexed audio. No extra MP3 is implied by counting an alias. Runtime-generated analysis-contrast children and other variation corpora are not included in the 100-child row. Other audio types (verb conjugation snippets, Learning Hub prompts and answers, standalone vocabulary and reviewed answer alternatives) are real learning content, but not in the base-card denominator.

The 834 entries reflect the **approved-only export inventory**, not a uniform sampling of the full app. All 110 Dutch Learning Hub prompts have recorded text in the index; 108/110 answer occurrences match the index, with the remaining two occurrences being the same sentence with an existing legacy recording. This does not establish that every Learning Hub UI actually offers its matching recording: each playback control must be checked at runtime.

**Do not spend the remaining ElevenLabs credits indiscriminately.** Prioritize independently reviewed workplace/IT sentences, the learner's weak grammar patterns and high-use native-sounding short responses, with deduplication and playback-surface checks first. The app intentionally keeps Dutch device TTS where no MP3 exists.

Reproduce the source-based coverage and MP3 checksum check:

~~~bash
node scripts/audit-recorded-audio.mjs
~~~

This is a read-only command, requires no API key or paid generation, and checks all indexed file paths, hashes and exact-text surface coverage. Its **expected baseline** from this snapshot: 834 indexed, 747/2,890 base cards recorded, 19/480 topic-lesson examples, 0/100 authored children. Rerun and resolve discrepancies before treating these counts as a release gate.

## 4. Functional, account, offline and accessibility risk

| Area | Evidence | Remaining acceptance work | Risk |
| --- | --- | --- | --- |
| Guest sessions, Study, Speaking, Quiz | 177 flashcard browser cases plus live 10-card guest smoke workflow | Manual correct/wrong scoring, refresh/back/resume and unusual question orders on phone | MEDIUM |
| Grammar / mixed / variations | 1,690 base grammar IDs; 61 mixed challenges; scoped browser tests | Native review; multi-topic mastery model; child families; independently tested real-learning outcomes | HIGH |
| Accounts / sync / recovery | APIs and local/session tests exist in repo; prior local Mongo fixtures documented | **Safe isolated account E2E**, two-device conflict tests, recovery, sessions after offline reconnection | HIGH |
| Offline/service worker | 4/4 production Playwright tests pass on PR #26 | Manual mobile offline/reconnection tests; multiple deploy upgrades | MEDIUM |
| French and de/het games | Existing French/game suites and stable core-game code; 177 browser tests | Explicit game clicking and French/account regression against current production version | MEDIUM |
| Accessibility/mobile | Documented axe, keyboard and 320–430px automated checks | Human NVDA/VoiceOver/TalkBack, contrast, focus order, audio-state feedback on phone | MEDIUM |
| Production | One new live MP3 directly playable (owner screenshot); fresh guest smoke navigation works | Check production commit/version, live recorded vs device fallback on learning screens, score persistence | MEDIUM |
| Dependency/security | Next 16.4.3; previous security-upgrade work documented | Fresh dependency audit, safe credential/session threat review, no production-destructive test | MEDIUM |

**Critical account-test safety:** tests/e2e/global-teardown.ts reads MONGODB_URI and deletes users whose usernameLower begins with e2e_, plus linked progress and sessions. Therefore never execute npm run test:e2e against a shared or live Atlas database. Create/approve an isolated throwaway test database and verify its URI and deletion scope first. The owner has not provided such isolated credentials in this audit.

**Standalone warning:** playwright.prod.config.ts runs next start despite the repository's standalone output configuration; Next emits a warning. The production suite did pass, so it was not the cause of the three prior test failures, but test-server startup should be aligned with the supported standalone entry point in a separate scoped change.

## 5. Documentation and release-state inconsistency

- README.md still says automatic Vercel deployments are disabled and a pushed version tag is required.
- docs/DEPLOYMENT.md contains an older "Releasing: tags only" section followed by a newer **28 October 2026** section saying **main merges auto-deploy**, and user changed the Vercel dashboard's ignored-build option to automatic.
- The Vercel dashboard, not contradictory repository prose, determines whether a given commit is deployed. Record the exact production commit hash and runtime smoke-test it.
- components/sessions/GrammarTopicLesson.tsx still says "Example audio uses the Dutch device voice"; exact matches can now play an indexed Flemish recording. This copy should be made conditional or clarified.
- PR #26 (three test-file changes) is still unmerged at the time of this audit. The passing 181 browser tests are evidence for that branch until the PR lands and CI re-runs.

## 6. A01–A25 acceptance decision

**A01–A23: PARTIAL** (working subsets but missing at least one mandatory acceptance criterion), **A24: VERIFIED only for the narrow protected-corpus/code-diff rule**, **A25: BLOCKED** (an independent final review is missing). This preserves the statuses in docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md and the frozen section-12 contract; it does not mark them complete merely because the new browser suites passed.

| Gate | Current assessment | Must happen before complete |
| --- | --- | --- |
| P0 inventory/design | PARTIAL | Document source-of-truth/schema decisions, true multi-topic coverage |
| P1 ALS vertical slice | PARTIAL | Independent lesson/card review and manual accessibility |
| P2–P5 grammar & practice | PARTIAL | Natural-language review, variations, reliable skill model |
| P6 stability/accessibility | PARTIAL | Human assistive-tech + real mobile testing and safe account sync |
| P7 independent release signoff | BLOCKED | External review, rollback drill, accepted A01–A25 evidence |

The explicit command npm run grammar:release-gate is documented as intentionally failing while these remain incomplete. Do not bypass it or re-label the result as a pass.

## 7. Prioritized action plan

**P0 — Preserve what works / close test PR:** Merge PR #26 only after review; re-run both Playwright suites and npm test on main. Keep runtime behavior unchanged. Keep the 834 recordings and original 600 immutable.

**P1 — Correct the most material product gap:** Create a separate audio-accessibility/coverage release plan from the exact numbers above. Verify controls on Learning Hub, word pronunciations, grammar lessons and variations. Target new paid MP3s only after editorial approval; TTS remains acceptable where there is no recording.

**P1 — Native Dutch review, starting with high-risk content:** Independently review 5–10 examples **per topic**, stratified by tense, clause order and prompt type. Record reviewer, date, original, corrected Dutch, faithful English, reason, and code/content hash. Expand review before claiming all 1,690 are high quality. Start with ALS/TOEN/WANNEER, omdat/want/daarom, separable verbs, relatives/indirect questions and advanced connectors.

**P1 — Account integrity on an isolated DB:** Set up an explicitly isolated test Atlas database or local Mongo fixture, run account registration/recovery/login/session sync and two-device conflict tests. Do not run shared/production teardown.

**P2 — Real-user/mobile and accessibility checks:** Walk ten representative cards across Study/Speaking/Quiz; toggle variation and refresh; test offline/resume and reconnection, one French session, each of the three word games; use keyboard-only and screen reader on mobile/desktop. Save screenshot/test evidence and device/browser versions.

**P2 — Grammar mastery model:** Decide whether grammar tags create separately tracked pattern skills; keep existing base/alias/child ratings stable. Any migration needs compatibility/rollback evidence.

**P2 — Docs and deployment hygiene:** Reconcile README/deployment instructions with actual Vercel settings; align standalone Playwright test server; correct outdated audio copy; perform a reversible deployment/rollback drill.

## Final conclusion

**DutchTap has a working tested core, and the full 834-recording pack has been merged, but the project is not yet a fully validated Grammar Mastery learning product.** The largest acceptance gap is **independently confirmed teaching quality**, followed by live-account two-device safety and manual accessibility, while recorded grammar audio coverage is still low by design. This report is an evidence inventory and prioritized plan, **not** native-speaker certification or production-wide release authorization.
