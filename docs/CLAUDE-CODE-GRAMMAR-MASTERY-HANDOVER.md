# DutchTap — Full Claude Code Handover and Execution Contract
**Project:** EtiDavid/dutchtap
**Owner-approved specification:** docs/GRAMMAR-MASTERY-MASTER-PLAN.md (DUTCHTAP-GRAMMAR-PLAN-001 v1.0, 25 October 2026).
**Teaching-quality contract:** docs/CLAUDE-GRAMMAR-TEACHING-EXEMPLARS.md (READ IT ENTIRELY, before authoring or evaluating a single grammar card).
**Work is ACTIVE, NOT COMPLETE.** Never turn "tests passed" or "card count reached" into "the entire plan is done."

# 0. Your mission: build a teacher, not a pile of flashcards

You are Claude Code, taking over implementation of DutchTap Grammar Mastery. Your job is to finish the approved P0–P7 feature plan in the existing Next.js app, using the current architecture, strict backward compatibility, trustworthy content quality and independently auditable evidence.

The learner is an English-speaking Nigerian adult in Belgium learning spoken Belgian-compatible Dutch, with strong IT/DevOps interests. Their primary barrier is spontaneous speech: they understand plenty when reading/listening but formulate answers in English first and translate mentally. They struggle especially with V2/inversion, subordinate word order and verb clusters, separable verbs, tense, pronouns and choosing the correct connector on the fly. A correct-looking translated sentence does not mean they can produce one spontaneously.

The learner wants:
- **WHY before HOW** (not grammar jargon dumped without reasoning).
- Understand an actual sentence phrase by phrase and WHY its precise word order follows from meaning/structure.
- Practice natural home, shopping, municipality, dental/phone call, office, Active Directory, server/cloud/DevOps contexts.
- A progression: **Learn the rule → Study fixed cards → Say It Yourself from Dutch-only real situations → Word Order / Error Correction → Optional interactive child variations → Mixed uncued retrieval → Review weak patterns**.
- Consistency with the existing flashcard sessions and app design, no unrelated new standalone training app.
- Dutch-first prompts and optional English hints, NOT translation-first by default. Early guided prompts can include structural hints; advanced ones must force selecting the correct conjunction independently.
- No timers/microphone grading in this phase. User self-rates honesty after revealing the model.
- A robust app they can start learning from, with accurate, non-generic explanations. Quantity without quality is a FAILURE.

**Core pedagogy directive:** Read docs/CLAUDE-GRAMMAR-TEACHING-EXEMPLARS.md. Its seven complete examples, anti-generic rubric, phrase analyses, errors/contrasts, Dutch-first prompts, alternatives and teaching-transfer standard are mandatory output-quality exemplars. Avoid copying the *same* exemplar explanation onto different cards. Every card needs a truthful bespoke analysis.

# 1. Current Git/repo status (snapshot; re-check before doing anything)

As inspected on 26 October 2026:
- Repository: EtiDavid/dutchtap.
- Work-in-progress branch: feat/grammar-mastery-phase1. It contains the existing Grammar Mastery implementation and audit docs. Preserve it.
- Previous PR #15: **MERGED INTO MAIN on 26 October 2026** (merge commit 892b5303429b1f945fbda40539fa7a76396c4880). This merged the *partial* Grammar Mastery foundation, NOT the full P0–P7 plan and NOT a production release. The feature branch has additional handover-only commits not yet in main. Re-check refs because Git can change.
- Current main already includes the **partial** Grammar Mastery foundation from PR #15, but it does NOT meet the full Grammar Mastery plan and does not automatically update production. Vercel Git deployments are disabled via vercel.json; prod deploy workflow triggers only on a pushed version tag pointing to a main ancestor.
- Master plan is FROZEN. Its original header says "NOT STARTED" because it was authored before implementation; do not change that baseline retrospectively. The living truth is docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md and docs/GRAMMAR-MASTERY-WORKLOG.md.
- **No direct push to main, merge, version tag, Vercel deployment, destructive migration, removal of source progress or production DB writes without explicit owner approval.** Changes may be committed to a clean feature/work branch, with reviewed PRs.

## First commands and sanity checks

Run these in the DutchTap repository (not NovaLab). First explain WHY to yourself/your execution log:

~~~bash
pwd
git status --short
git worktree list
git branch -vv
git fetch origin --prune --tags
git log --oneline --decorate -10
git show-ref --verify refs/remotes/origin/feat/grammar-mastery-phase1
~~~

- If worktree is dirty: preserve EVERYTHING and inspect. Do not use reset --hard, clean -fd, force-push or overwrite another agent's changes.
- Create a dedicated worktree/branch with all the partial Grammar Mastery implementation and new teaching/handover documentation (e.g. feat/grammar-mastery-completion). PR #15 is ALREADY on main; the feature branch is only **5 documentation commits ahead and one merge commit behind** main at this snapshot. Prefer merging/reconciling the small documentation-only delta into a fresh branch based on current main, or open a separate documentation PR and continue from it; do not cherry-pick all 48 already-merged feature commits again.
- Check current PRs/branch state: #15 merged at 2026-10-26 17:35 UTC, SHA 892b5303. Re-check on every run; do not create duplicate implementation PRs from commits already on main.
- Read package.json (Next.js 16 / React 19); read AGENTS.md; **read the relevant installed node_modules/next/dist/docs/** before modifying Next.js code, per repo convention.
- Read these documents COMPLETELY: master plan, this handover, exemplars, acceptance audit, work log, architecture, stage-1 handover, French handover, grammar reuse decision, deployment, learning first-release notes. Inspect all actual files before editing them.
- Baseline snapshot: command outputs, exact SHA, current CI, counts, review debt, known security advisories. Add a dated entry to the work log at the start of your first implementation session.

## Required Git workflow

1. Preserve the existing feature implementation; work on new topic/phase changes as small, individually revertible commits.
2. Do NOT create broad speculative mass changes that all need to be debugged together. Finish the smallest complete vertical slice, test it, then expand.
3. Do not use a giant unreviewable rewrite of session types or source cards. Extend existing abstractions with migration tests.
4. For a completed, coherent scope: open or update a PR to the appropriate target, list passes and limitations; never label full Mastery complete until A01–A25 all verified.
5. Do not merge or deploy until explicitly approved by owner and the relevant release gates pass. If you cannot test a workflow (e.g. no test DB), report "not run" instead of "pass".
6. End each active execution session with a concrete Done / Still open / Failing / Next status, commits and test evidence. No claims that you will silently work while no agent process is running.

# 2. Non-negotiable architecture and compatibility

**App stack:** Next.js App Router 16.x, React 19, TypeScript, Tailwind 4, MongoDB Atlas, username/password auth, guest/device progress plus account sync. Static read-only grammar content belongs in repo assets, not repeated in MongoDB sessions.

## Preserve these invariants

- 600 Everyday Dutch + 600 Dutch at Work original cards (**CORE_CARDS=1,200**); their historical IDs, sentence text/answer IDs, images, recordings, French mappings and saved progress must survive.
- French Everyday is a separate language; grammar/workplace collections are Dutch-only; never show Dutch-only grammar in a French session.
- Existing de/het, deze/dit/die/dat and adjective-ending games; achievements/streaks/stats; Learning Hub /learn routes; auth/recovery, and navigation remain functional.
- Session creation chooses a FIXED set of unique base card IDs (1–100) and the same members appear in Study/Speaking/Quiz even if order changes. No silent substitution or duplicating one underlying source because it has multiple tags.
- Maximum five active sessions, including cross-language; starting level Difficult unless already rated; levels Difficult/Medium/Easy/Mastered.
- Speaking is **self-rated**, not speech recognized. Main/child levels and streaks/quiz scores must remain independent where the product contract demands.
- Existing session retirement rules and action/replay/event idempotence remain; prevent double points from reload/history or cross-device races.
- Offline/local-first behavior and guest/account isolation continue; do not mutate production Atlas for tests.
- Variation children are optional, independently tracked; up to ten only where content is genuinely meaningful, with progressive release and no change to the fixed parent-card set.
- Preserve old grammar aliases once introduced and any saved session referencing them. No renumbering original pat-* IDs.
- Preserve distinct historical answer IDs when adding alternatives; decide whether a second answer is truly equivalent to the same task before accepting it.

## Files to inspect before changes

| Area | Existing paths | What to respect |
| --- | --- | --- |
| Approved baseline | docs/GRAMMAR-MASTERY-MASTER-PLAN.md | P0–P7, §§3–10, A01–A25; DO NOT overwrite its requirements |
| Living evidence | docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md, docs/GRAMMAR-MASTERY-WORKLOG.md | Proof-backed statuses and exact counts; update after each phase |
| Good pedagogy | docs/CLAUDE-GRAMMAR-TEACHING-EXEMPLARS.md | Exact teaching density/style, examples, incorrect alternatives, Dutch-first situation prompts |
| Source engine | scripts/build-grammar-patterns.py; data/learning-tasks.json; data/editorial/grammar-pattern-extra.tsv; data/editorial/grammar-als-expansion.json; data/editorial/grammar-new-time-patterns.json; data/editorial/grammar-separable-cards.json, grammar-separable-verbs.json | Generated files must come from a canonical audited source; ensure deterministic rebuild |
| Generated content | data/grammar-pattern-cards.json; data/grammar-pattern-notes.json | NEVER hand-edit generated output alone |
| Topic guides | data/grammar-topic-lessons.json; components/sessions/GrammarTopicLesson.tsx | One detailed lesson per topic, collapsible everywhere, user-controlled, supports device audio |
| Card analysis | lib/grammarBreakdowns.ts; components/flashcards/GrammarNotes.tsx; components/flashcards/GrammarAlsAnalysis.tsx | **Current major gap:** no bespoke structured breakdown data for new authored grammar cards |
| Cards / reused source | lib/flashcards/engine.ts; lib/content/cards.ts; data/grammar-reuse-links.json; lib/content/collections.ts | Keep original IDs/content; support multi-topic tagging without falsely sharing mastery |
| Speaking / alternatives | components/sessions/GrammarScenarioPrompt.tsx, SpeakingMode.tsx; lib/practice/communication.ts | Dutch-first only where scenarioNl exists; alternative model selection must preserve meaning and model ID |
| Quiz / repairs | components/sessions/QuizMode.tsx, GrammarErrorRepair.tsx; lib/sessions/wordOrder.ts | Word tiles, session points/retirement, explicit alternatives; never claim machine grammar parser |
| Session lifecycle | lib/sessions/engine.ts; types.ts; store.ts; app/api/learning-sessions; components/sessions/SessionView.tsx, CreateSessionDialog.tsx | Fixed membership, idempotence, scoped sync/migration |
| Children | data/grammar-variation-families.json; lib/variations/content.ts; components/sessions/VariationPractice.tsx | Separate child IDs/levels/unlock; passive examples NOT counted |
| Tests | tests/grammar.*.test.ts; tests/flashcard-e2e/grammar-*.spec.ts, session/french/legacy suites | Extend with content-specific, old-session, sync, mobile and actual learning-transfer tests |
| Deploy safety | vercel.json; .github/workflows/deploy-production.yml; docs/DEPLOYMENT.md | Merge alone doesn't deploy; version tag can, so NO tags without owner approval |

**Known current weakness:** GrammarAlsAnalysis.tsx uses a limited regular expression to recognize basic "Als ..., ..." and "... als ..." patterns. That is a conservative display, NOT a reliable parser for all 100 ALS models, imperatives, unusual word order, compound structures or nested clauses. Replace or augment with explicitly authored reviewed structure data; never auto-label finite verbs using naive string matching.

# 3. Exact starting inventory and honest shortfalls

These are known on the prior development branch; re-run programmatic counts before relying on them:

- Original Core Dutch: **1,200**.
- Legacy original grammar: **196** authored cards across 9 topics.
- Feature branch: **432 authored grammar + 53 source aliases = 485 playable grammar base card IDs** across 13 topics; **1,685 total Dutch card IDs** across collections.
- **100 ALS** base cards = 19 legacy + 58 new authored + 23 core aliases. Reaching 100 only satisfies card COUNT, not P1 content/pedagogical acceptance.
- 236/432 authored grammar cards have Dutch-first scenarioNl; **196 authored lack it**. The 53 source aliases do not add reviewed Dutch-first prompts.
- **30** independent interactive child variations on just **three** ALS parent families. **482/485** grammar base parents have no complete ten-child family. Passive examples in notes are not scored children.
- **52** distinct authored separable verbs (60–100 target) and **152** practice cards (150–200 target), but no full per-verb native editorial verification.
- 13 topic-wide lessons: **6 v1.0** (als, separable, inversion, omdat, dat, verbs), **4 v0.8** (wanneer, terwijl, voordat, nadat), **3 v0.2** (toen, tot, tense). Never call all 13 "complete".
- Audit matrix A01–A25 last counted **21 PARTIAL, 3 BLOCKED, 1 VERIFIED narrowly (frozen Academy diff)**.
- Scope CI at commit dd87b3d: **347 Vitest passed (7 optional DB skipped), 5 focused Chromium Playwright passed**, generator/lint/typecheck/content learning check/build passed in GitHub Actions run 40368168185. This is NOT proof of full functionality/content accuracy.
- npm install/audit previously reported eight advisories (3 moderate, 4 high, 1 critical), not yet triaged. Do NOT blindly npm audit fix --force.
- Existing comprehensive editorial queue may still fail npm run content:review-check intentionally; that is not equivalent to content:learning-check and must be reported separately.

## Topic counts and target gaps

| Topic | Available base | Approved target | Still needed, by raw count |
| --- | ---: | ---: | ---: |
| ALS | 100 | 100 | 0, but still incomplete *per-card* review |
| V2/inversion | 20 | 100 | 80 |
| Omdat | 29 | 100 | 71 |
| Dat | 39 | 100 | 61 |
| Toen | 22 | 100 | 78 |
| Wanneer | 14 | 100 | 86 |
| Verbs in context | 36 | 100 | 64 |
| Past/perfect | 17 | 100 | 83 |
| Separable verbs | 152 | 150–200 | Need ≥8 additional verified lemmas; construction coverage |
| Terwijl | 12 | 60–100 | ≥48 |
| Voordat + Nadat | 24 | 100 combined | 76 |
| Tot/totdat | 20 | 60–100 combined | ≥40 |
| Zodra + Zolang | 0 independent full topic | 60 combined | 60 |
| Of = whether | 0 | 60 | 60 |
| Hoewel + Tenzij | 0 | 60 combined | 60 |
| Relative clauses | 0 | 100 | 100 |
| Indirect questions | 0 | 100 | 100 |
| Other advanced connectors | incomplete | qualitative | truthful coverage, not arbitrary quota |

Counts above are *planning targets*, not permission to mass-generate meaningless filler. Deduplicate underlying sentences, honor targeted grammar function, and report shortfalls rather than pad. The plan explicitly distinguishes conjunctions from adverbs, prepositions, interrogatives, relative words and coordinating connectors.

# 4. Implementation phases: finish real vertical slices

**Do the following in order, without skipping the acceptance gate of each phase.** You may complete phases iteratively across many independent sessions; progress only exists after an actual commit/test. If time/context capacity is limited, stop at a safe checkpoint with a verified worklog and a precise next action.

## P0 — Reconcile inventory and schema (unfinished)

1. Re-check frozen requirements, current branch, pending PRs, counts, source candidates and review hashes.
2. Review all 196 legacy grammar cards and all 1,200 core sentences for justified grammar tags; do not derive tags from substrings. A word "dat" may be demonstrative, relative or subordinating; "als" may be comparative ("als een plan") rather than conditional.
3. Propose a migration-safe content model: per-card analysis with span labels, per-topic justified tag/subskill/provenance, sourceID, aliasID, per-topic skill mastery, child metadata, accepted models. Avoid storing repeated static lessons per user.
4. Produce typed schema validators/coverage checks and preserve historic pat IDs and all original sessions.
5. Gate: evidence-based inventory, schema decision record, migration test outline and known unresolveds.

## P1 — Finish ALS, first full example of the entire system (**IMMEDIATE PRIORITY**)

1. **ALS topic lesson:** verify the 8-section v1 against authoritative Flemish/Dutch grammar; if assertions are too absolute or misleading, correct the canonical lesson source. It must cover if/when/whenever, habitual vs specific past, future present, main-first/subordinate-first, inversion, modals, perfect/verb clusters, separables, and nuanced wanneer/toen contrasts.
2. **Every one of 100 parent cards** must have structured, manually checked sentence-specific analysis, not just generic topic notes. Distinguish 77 authored from 23 source aliases (source breakdowns may be reused only if actually apt for the target ALS interpretation). At minimum, exact constituent/clause spans, conjunctive meaning, subject/finite verbs, WHY of order and tense, context-faithful translation, concrete common mistake, explanation, contrast/correct alternative, review status.
3. **Do not use the old basic regex as ground truth.** Design a reviewed JSON/type-safe per-card analysis data source, enrich alias lookup safely, generate display from authored labeled spans; validation must ensure concatenated spans reconstitute the original sentence. Handle no-comma, nonfronted ALS and special forms deliberately.
4. Review 100 distinct parent scenarios and their translations and explanations, plus all 58 new clause-order alternatives; accepted alternatives only where exact meaning/person/tense remains appropriate. Do not claim exact-string rejection means bad Dutch.
5. Dutch-first Speaking for all 100 ALS base situations with unobtrusive optional English, beginner opt-in hints and progressively uncued prompts. No exact answer leakage.
6. Deliver meaningful interactive child variations (up to 10 per parent where independently reviewed). Distinct scenario, Dutch model, English, different verb/tense/role/ordering, explanation, persistent ID and independent level; never turn passive examples into fake progress. If some parent cannot support ten good children, record that as a documented content exception.
7. Full tested flow: create fixed 10-card Difficult session → learn topic → inspect per-card spans/audio → Study Next/Back → Speaking Dutch prompt/reveal/self-rate → Quiz both clause orders/reasons → child toggle, unlock and progress → refresh → guest restore and logged-in cross-device sync → offline/reconnect. Responsive viewport 320/375/430, tablet and desktop; keyboard and reduced motion checks.
8. Gate P1: credible complete mini-curriculum and demonstrated end-to-end learning transfer. Report **honest exceptions/deferrals**. No claim all P0–P7 done merely because P1 passes.

**Operational batch policy:** Process ALS in editorial batches of 10–20. For each batch: inspect canonical parent + source notes + actual grammar; author complete custom analysis and prompt; run semantic/structural checks; spot-check varied constructions; commit with file/test evidence. Repeat until all 100 or explicitly documented exceptions are resolved. No cloning a blanket rule into 100 fields.

## P2 — Major sentence structure

1. Expand V2/inversion, omdat, dat, toen, wanneer toward planned meaningful 100-card targets each, reusing accurately tagged existing sources first. Preserve grammatical intent: because vs result, reporting vs demonstrative, one past vs recurring past, conditional vs temporal.
2. Complete their topic-level why-first guides and per-card structure; add many-context contrasts, exact common errors, full language review.
3. Implement controlled mixed selection/repair tasks without overt conjunction prompts; preserve fixed session set and per-skill progress.
4. Gate P2: audited content, distinct scenarios, verified grammar coverage and usable structured lessons; do not advance based on counts alone.

## P3 — Separable verbs, auxiliary choices and tense

1. Build 60–100 curated high-value separable lemmas, validate against source dictionaries and common Belgian usage; currently 52.
2. Cover present separated, past separated, perfect joined with relevant auxiliary, modal + bare joined infinitive, subordinate joined finite, "te" inserted, imperative, fixed-preposition/reflexive contexts, and inseparable lookalikes. Multi-verb order notes must be qualified, not universal.
3. Finish 150–200 *reviewed* separable practice cards and complete 100 "Verbs in Context" and 100 "Past & Perfect" by targeted meaningful reuse/authorship.
4. Teach **hebben ≠ moeten ≠ hoeven** properly. See Exemplar D in the teaching document. Distinguish perfect auxiliary vs possession, and no-necessity vs prohibition.
5. Gate P3: per-verb correctness and representative construction coverage, not mere lemma count.

## P4 — Extended subordinate constructions and clause families

Implement the approved scope: tot/totdat, terwijl, voordat/nadat, zodra/zolang, "of" meaning whether vs or, hoewel/tenzij/ook al contrasts, direct/indirect questions, relative die/dat/wie/wat/waar, and further nuanced connectors (mits, indien, aangezien, doordat, zodat, alsof, naarmate, etc.) as appropriate. Make functional topic grouping but preserve direct deep links and familiar pattern tiles. Avoid labeling every connector as "subordinating": want/maar/en/of(or) coordinate; daarom and dus have other functions/word-order behavior.

Gate P4: correct classification, natural documented examples, enough distinct practice situations to select forms from communicative intent.

## P5 — Multi-tag reuse and genuine "Think in Dutch" mixed mastery

1. Audit Core and Grammar for justified multiple grammar subskill tags and index by source ID; prevent a duplicated underlying sentence showing twice in a single fixed session. Original cards stay immutable.
2. Track **per-pattern skill progress** independently from original sentence recall and child level, including merge/restore semantics across devices.
3. Add focused easy-first and controlled mixed sessions, then increasingly uncued Dutch-only scenarios where user *chooses* condition/reason/time/reporting/relative, not just fills known connector.
4. Review weak structures more often, mastered less often but never zero. Include cross-pattern "Als de server uitvalt, ..."; "Omdat ik het bestand heb opgeslagen, ..."; "Toen ik thuiskwam, ..."; "Ik denk dat ... kan ...".
5. Explain multi-pattern reasoning after reveal. Integrate/share content intentionally with older /learn Think in Dutch, avoiding divergent stores of the same task.
6. Gate P5: demonstrated spontaneous retrieval on new scenarios plus correct per-skill progress, including resume/sync.

## P6 — Stable accessible learning release

Manual/automated mobile (320/375/430, tablet/desktop), keyboard, screen-reader labels, voice settings nl-BE preference/fallback, audio stop across navigation, reduced motion, offline and service-worker updates, no answer leaks, no broken long text overflow. Confirm old core and French, account recovery/guest merge, de/het games, points/stats/streaks, session restore, histories, historical IDs, routes.

Gate P6: tested, reversible, safe release candidate; security dependencies triaged without forcing breaking upgrades.

## P7 — Independent audit, editorial proof, release

1. Programmatically recount authored/base/ref/child/passive/verb totals and per-topic requirements, with stable IDs and coverage by tense/structure/scenario.
2. For every A01–A25 requirement, record exact file/line/test/commit and state VERIFIED only after **actual** independent review and acceptance. Do not mark all as done based on authored content alone.
3. Run relevant unit, integration, browser, old-session/account/local DB, mobile, offline, content review, build and security tests; report PASS, FAIL, SKIPPED, NOT RUN separately.
4. Verify no native speaker was claimed unless a named independent reviewer genuinely reviewed the content. AI self-review is "AI-edited".
5. Owner reviews PR; only owner-approved merge, release tag and production smoke test after gates. Prepare rollback and historical session migration evidence.
6. Never change frozen Academy curriculum without a separate approved change request.
7. Gate P7: only declare COMPLETE when every required audited acceptance item is truly verified and there are no hidden blockers.

# 5. The exact expected authoring schema and editorial workflow

Use the actual existing breakdown interface in lib/grammarBreakdowns.ts as compatibility baseline:
- meaning
- parts: [{label, text}]
- order
- forms
- compare
- mistake: {wrong, right, why, alternative?}
- practiceFocus?
- practiceGuide?

The approved plan demands *richer* structured clause/spans, not generic sentence fragments. A possible **additive** conceptual record is:

~~~text
id; sourceCardId (optional); topicId; reviewedVersion; reviewStatus;
situationNl + optional situationEn;
communicativeGoal (English teaching line);
dutchModel; faithfulEnglish;
clauseSpans [{kind, text, whyThisClause}];
constituents [{start/end or exact literal slice, role, finiteVerb?, explanation}];
formNotes [{verb, lemma, tense, subjectAgreement, auxiliary, particle, why}];
englishContrast; sentenceSpecificWhy; errorModels [{wrong, right, why}];
approvedAlternatives [{modelId, dutch, english, whenEquivalent, nuance}];
passiveExamples [{nl,en}]; childVariationIds [];
sourceURLs; reviewedBy; reviewedAt; contentHash.
~~~

**This is a schema sketch, not permission to invent a parallel unintegrated data model.** Inspect existing UI and storage, choose the smallest safe compatible extension, centralize validation, use versioned canonical sources, and update the generator/deterministic outputs. Model spans must be faithful to the ACTUAL sentence; writing empty dummy explanations to satisfy a schema is forbidden.

**Per-card quality workflow** (repeat for every item, no shortcuts):
1. State intended real communicative act and pragmatic assumptions.
2. Read its original Dutch, English, scenario and ten passive examples; confirm they agree.
3. Identify actual clauses, subjects, finite verbs, objects, predicate, particles, tense/auxiliary, conjunction function **by grammatical analysis**; tag only justified topics/subskills.
4. Explain the WHY of each relevant position; contrast independent/main clause and English temptation.
5. Check at least one credible wrong construction and explain correction; use second mistake when two mechanisms are trained.
6. Produce Dutch-first prompt without model/target conjunction leakage (unless early opt-in guidance); English help must match facts.
7. Distinguish same-meaning alternative from changed tense/emphasis/register; do not auto-accept false semantic matches.
8. Write natural related examples and optional, independently reviewed/trackable child variations; no cloned template with replaced nouns.
9. Validate text spans, English fidelity, semantics, IDs, grammar sources and review status; if uncertain about a subtle Flemish form, research and record source, mark for human review.
10. Exercise the UI with a real scenario and confirm the learner can make a NEW sentence in a different context using that reasoned rule.
11. Commit with a test/provenance record and link any unresolved issue to the review queue.

**Reject these generic anti-patterns:** "Because it is subordinate"; "Verb goes at the end"; "Subject and verb switch"; "Dutch uses this tense"; "This is a separable verb"; identical why text on hundreds of cards; scenarios of the form "Translate X to Dutch" in advanced mode; English-only if Dutch prompt is achievable; every accepted answer assumed equally good; assigning subject/finite labels by naive regex. **The pedagogical examples file includes correct replacements.**

## Review/provenance levels

- DRAFT — not linguistically checked.
- AI-EDITORIAL-CHECKED — model examined exact content for grammar/meaning/scenario, with record/version/hash and unresolved issues.
- INDEPENDENT-NATIVE-VERIFIED — ONLY when an actual independent proficient reviewer verifies content and that provenance is recorded. An LLM cannot self-award this.
- BLOCKED — contradictory scenario/model, uncertainty or missing sources; do not publish as approved.
- Pass of an automated JSON/type/schema/unit test is NOT editorial verification.
- Even after independent checks, language may admit variants; show appropriate nuance.

# 6. Test commands and hard safety boundaries

Use the current package.json, installed Node/Next docs and existing tests. Start with:

~~~bash
npm ci
python3 scripts/build-grammar-patterns.py
git diff --exit-code -- data/grammar-pattern-cards.json data/grammar-pattern-notes.json
npm run lint
npx next typegen
npx tsc --noEmit
npm test
npm run content:learning-check
npm run build
npm run test:flashcards -- tests/flashcard-e2e/grammar-mastery.spec.ts tests/flashcard-e2e/grammar-patterns.spec.ts tests/flashcard-e2e/grammar-variation-persistence.spec.ts
~~~

Then expand tests as phases demand. Browser test suite should eventually cover first-time learner full 10 ALS cards with linked Core, mode transitions, real variation family, refresh, offline, logged-in and guest merge, French protection, account sync, mobile and a11y. Unit tests should validate meaningful grammar coverage, exact span integrity, scenario/model match and correct alternatives in addition to counts and stable IDs.

**Separate gates:**
- npm run content:review-check — existing outstanding editorial backlog, can legitimately FAIL until actually resolved. Record exact remaining items.
- npm run grammar:release-gate — intentionally FAILS while A01–A25 audit contains Partial/Blocked/explicit unapproved release wording. It is a *release* control, not a failure of normal development CI. **Never bypass or alter it merely to get green.**
- npm run test:e2e — **WARNING: touches real Atlas** using test accounts. Do NOT run it with production DB secrets; require isolated safe DB, credentials and authorization.
- npm run test:sessions-db — local test Mongo only, set TEST_MONGODB_URI to 127.0.0.1:27018 as documented.
- npm audit — investigate vulnerable dependency roots, exploit applicability and safe remedies; do not use --force without impact review.
- npm run test:prod and assets:flashcards — run when relevant; disclose any env prerequisites.

**No overclaiming:** record exact commands, commit SHAs, counts, pass/skip/fail, Playwright projects/browser matrix and what is still untested.

# 7. Acceptance-driven working protocol (what to do each session)

BEFORE:
- Read README, AGENTS, approved plan, teaching exemplars, latest worklog and acceptance audit.
- Verify git status/branch/PR and newest current main/feature comparison.
- Identify smallest unfinished requirement ID and its explicit acceptance criteria, tests and migration risks.
- Explain your design briefly before making commands/edits; proceed autonomously when safe, without asking repeated questions already answered here.

DURING:
- Prefer real distinct exercises, sourced and editorially checked, over huge generic card dumps.
- Implement one coherent vertical slice; run targeted tests; fix failures rather than report them as green.
- Add programmatic count/shape/coverage/dedup tests, **then** targeted browser checks and human-like scenario spot checks.
- Never overwrite user changes, break data migration, leak secrets, add paid media/APIs or silently alter approved product scope.
- Use existing component design system; no unnecessary visual redesign and no app rewrite.
- Document architectural decisions affecting sessions, variants and mastery in a decision record/worklog before hard-to-reverse changes.

AFTER:
- Update docs/GRAMMAR-MASTERY-WORKLOG.md, docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md and README if scope/counts change.
- Record each requirement as VERIFIED/PARTIAL/BLOCKED with exact evidence; do not reset the master plan to pretend acceptance.
- Commit logically; create/update a review PR with the precise completed scope, test evidence and remaining gates.
- Stop at a safe point (green tests plus remaining blockers) if human/native review or production decision is needed. No false "fully done" without proof.

### Format of EVERY development summary

~~~text
Branch / HEAD / PR:
Approved requirement IDs worked:
DONE (with file paths and commits):
STILL OPEN (exact card/topic counts and unfinished IDs):
TESTS (commands, pass/fail/skip; what was NOT RUN):
CONTENT REVIEW (AI-edited vs independent-human verified):
COMPATIBILITY / MIGRATIONS:
SECURITY / DEPLOYMENT (never assume deployed):
NEXT SMALLEST IMPLEMENTATION STEP:
~~~

# 8. First implementation job — execute immediately

**P1 / A03 is the first critical blocker.**

Work in a clean feature branch/worktree based on current main, incorporating the handover-only documentation delta from feat/grammar-mastery-phase1 without replaying its already-merged implementation history. Begin with 10 diverse ALS parents: fronted single finite, main-first conditional, habitual past, perfect/end-cluster, modal, separable, negative, imperative edge case, complex IT example, and linked Core alias. Choose actual published IDs by inspecting the source rather than inventing them. Define *reviewable* clause/constituent analysis schema and runtime display aligned with the gold-standard teaching examples, then author thoroughly individual analyses for these ten and add tests verifying literal spans, finite roles, specific why/error notes, scenario fidelity and UI rendering.

Only after these ten pass realistic pedagogical and structural checks, extend to all 100 ALS parents by editorial batches of 10–20; never auto-fill with uniform why strings. Check any saved session/alias compatibility. Continue through other approved P1 items, then progress to P2–P7.

**Do not stop after producing a plan or a few prototypes** if you can continue editing/testing in the active Claude Code execution. Conversely, never claim asynchronous work or work after execution has ended. Leave exact resume steps in the worklog.

# 9. Authoritative references and change control

- Primary source of *requirements*: docs/GRAMMAR-MASTERY-MASTER-PLAN.md.
- Primary source of *pedagogical standard and examples*: docs/CLAUDE-GRAMMAR-TEACHING-EXEMPLARS.md.
- Primary source of *current status*: docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md + WORKLOG.
- Primary source of *runtime truth*: actual current Git branch, source files and observed passing tests.
- Source references for subtle language: taaladvies.net; vlaanderen.be/team-taaladvies; reputable Dutch grammar. Verify exact claim and cited URL, with special care for variation in Belgian usage.
- Academy frozen curriculum is distinct from app categories. Do not change it, its 90%-promotion standard, or assert its pedagogical tests are identical to the app's four rating levels/ten-streak retirement without a formally approved change request.
- Avoid generic hallucinated grammar, duplicate variations, false "native review", fake CI results, blind schema migrations, corrupting user history and shipping drafts.

**Owner's final quality question:**
> If I see an unfamiliar real situation in Belgium or at an IT job, can I choose the appropriate Dutch construction and explain WHY I placed each verb there, instead of translating an English sentence word by word?

If the lesson, card, prompt and feedback do not move the learner toward that outcome, the feature is not finished.
