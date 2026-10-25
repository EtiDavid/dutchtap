# DutchTap — Grammar Mastery Expansion
## Master Implementation Plan, Requirements, Work Log and Final Audit Checklist

**Document ID:** DUTCHTAP-GRAMMAR-PLAN-001  
**Version:** 1.0 — approved design baseline  
**Created:** 25 October 2026  
**Owner:** DutchTap project  
**Repository:** `EtiDavid/dutchtap`  
**Recommended permanent repository location:** `docs/GRAMMAR-MASTERY-MASTER-PLAN.md`  
**Implementation status:** **NOT STARTED — planning document only**  
**Purpose:** The durable, authoritative checklist for implementing and auditing the agreed Grammar Patterns upgrade. Every implementation session must read this document before making changes, update its work log, and cross-check the acceptance criteria before claiming completion.

> **Operating rule:** Do not interpret this file as evidence that any feature has been implemented. `[ ]` means not verified. Only mark an item `[x]` after inspecting the actual implementation and attaching proof (file/commit/test/manual result). Do not mark an entire phase complete because the UI looks correct. A partial result must remain explicitly partial.

---

# 1. Mission and success definition

The learner understands quite a lot of spoken or written Dutch but struggles to generate natural sentences without composing them in English first. The critical pain points are **main-clause V2, inversion, subordinate-clause verb placement, verb clusters, separable verbs, and choosing the correct conjunction for the context**.

**Mission:** Transform DutchTap's existing **Grammar Patterns** area from a useful sentence deck into a structured **Learn → Study → Say It Yourself → Word Order / Error Correction → Variations → Mixed Retrieval → Review** system. Explanations must teach **why** the sentence works, not merely state the rule; practice must increasingly require original Dutch sentence production.

## 1.1 Learner-facing success

- The learner can open **Als**, read a detailed **collapsible** lesson like a careful one-on-one grammar explanation, and keep it accessible throughout the session.
- The learner selects 10, 20, 30, 50, 100 (or a supported custom number) **real, distinct cards** and practices that **fixed selection** across Study, Speaking and Quiz.
- Each card has a natural Dutch sentence, faithful English meaning, realistic scenario, **specific step-by-step sentence analysis**, grammar reasons, at least one relevant mistake/contrast, useful related examples, and device-voice audio where available.
- **Say It Yourself** begins with a real-world **situation**, not always “translate this English sentence”; Dutch-first is available, English help is optional, answers remain hidden until deliberate reveal, and acceptable alternative answers are explained rather than treated as errors.
- A learner may **enable additional interactive questions** tied to the current card. Each such variation has its **own scenario, explanation, difficulty/progress**, and can appear in speaking and quiz as in the existing main flashcard system. It must not be confused with the ten passive examples inside a lesson.
- Previously existing Everyday / Dutch at Work sentences can be **reused across relevant grammar topics** by reference, without blindly cloning their content or losing saved progress.
- Learners are progressively trained on **when to select a conjunction** and when to use subordinate vs. main-clause word order, not simply cued to say “als” every time.
- Learners can move from single-topic mastery to **mixed grammar reflex practice**, especially combined subordinate clauses, V2 inversion, tenses and separable verbs.
- Existing DutchTap sessions, ratings, account synchronization, offline behavior, French content, existing cards, games, achievements and navigation continue working.

## 1.2 Non-goals for initial releases

- Do **not** regenerate paid audio, images, or voice recordings as a prerequisite. Grammar cards can use the correct **device Dutch voice**; recorded audio can be a later approved project.
- Do **not** replace all historical Everyday/Workplace flashcards or rewrite user history.
- Do **not** silently change the frozen Nova Dutch Academy official grammar curriculum. App product categories and Academy curriculum modules are not interchangeable (see §2.4).
- Do **not** claim flawless natural Dutch, human-reviewed content, or objective pronunciation scoring without evidence.
- Do **not** launch microphone-based automated scoring in the first release. That needs a separate consent, privacy, accuracy and product-design decision.
- Do **not** push implementation to production until the release checklist passes. Prefer a review branch/PR; account for Vercel's current preview-deployment settings so an exploratory push does not create unwanted builds.

---

# 2. Verified baseline and constraints (as inspected 25 October 2026)

## 2.1 Existing grammar collection counts

| Current topic ID | Current title | Current unique grammar cards |
|---|---|---:|
| `inversion` | Verb second & inversion | 20 |
| `omdat` | Omdat | 20 |
| `dat` | Dat | 20 |
| `als` | Als | 19 |
| `tot` | Tot | 20 |
| `toen` | Toen | 20 |
| `verbs` | Verbs | 36 |
| `separable` | Separable verbs | 24 |
| `tense` | Past & perfect | 17 |
| **Total** | **9 categories** | **196** |

`CORE_CARDS` currently contains **1,200** Everyday and Dutch at Work cards in addition to these 196 Grammar Pattern cards. The older **Verb Lab** contains **20 explicitly listed verbs, 8 separable**. Record fresh counts before implementing: repository content may change after this inspection.

## 2.2 Current implementation and data locations

Read these, not just this plan, before editing:

| Path | Why it matters |
|---|---|
| `docs/GRAMMAR-PATTERNS.md` | Current behavior and deliberately missing grammar variations / breakdowns |
| `docs/ARCHITECTURE.md`, `docs/STAGE-1-HANDOVER.md` | Client/server session contracts, persistence, sync, action/replay safety |
| `docs/learning/README.md`, `docs/GRAMMAR-COVERAGE.md` | Learning lab status, editorial review limitations, gaps |
| `AGENTS.md` | Project-specific development conventions, Next.js version notes |
| `data/learning-topics.json` | Current **short** topic rules |
| `data/learning-tasks.json` | Original 110 learning tasks |
| `data/editorial/grammar-pattern-extra.tsv` | Additional grammar-pattern source sentences |
| `scripts/build-grammar-patterns.py` | Generates grammar cards and notes |
| `data/grammar-pattern-cards.json` | **Generated** grammar cards |
| `data/grammar-pattern-notes.json` | **Generated** sentence-specific notes/examples |
| `data/learning-verbs.json` | Initial explicit verb records |
| `data/flashcards.json`, `data/flashcard-additions*.json`, `data/workplace-cards.json` | Existing main sentences suitable for reuse |
| `data/grammar-breakdowns.json`, `data/workplace-breakdowns.json` | Existing structured per-sentence analysis conventions |
| `components/sessions/PatternTiles.tsx` | Current nine grammar tiles and counts |
| `components/sessions/CreateSessionDialog.tsx` | Fixed card count, topic, level, create-session flow |
| `components/sessions/SessionView.tsx` | Study/Speaking/Quiz navigation |
| `components/sessions/StudyMode.tsx` | Read/listen study flow |
| `components/sessions/SpeakingMode.tsx` | Self-rated scenario-driven recall |
| `components/sessions/QuizMode.tsx`, `lib/sessions/wordOrder.ts` | Word-tile quiz and exact canonical-word grading |
| `components/flashcards/GrammarNotes.tsx`, `lib/grammarNotes.ts` | Existing collapsible **per-card** explanation |
| `components/sessions/VariationPractice.tsx`, `lib/variations/content.ts` | Interactive child variations (currently core cards only) |
| `lib/content/collections.ts`, `lib/content/cards.ts`, `lib/flashcards/engine.ts` | Topic/collection registry, source card selection, shared levels |
| `lib/sessions/engine.ts`, `lib/sessions/types.ts`, `lib/sessions/store.ts` | Session invariants, local-first actions, progress and schema |
| `components/learning/LearningHub.tsx` | Existing Sentence Builder / Verb Lab / Think in Dutch integration |
| `tests/`, `tests/flashcard-e2e/`, `tests/prod-e2e/` | Unit, browser and production regressions |

**Known baseline behavior:** session selection is fixed at creation; maximum **100 cards per session**, **5 active sessions** across languages; unreviewed/new cards start Difficult; existing variations for core cards have up to **10** children, progressively released; Speaking/Quiz use separate streaks and require **10 consecutive relevant successes** to retire a card in that session. Preserve behavior unless a proposed change is clearly specified and migration-tested.

## 2.3 Existing limitations to fix

1. Pattern-wide explanations are far too short (`data/learning-topics.json`).
2. Current grammar card notes describe individual sentences but lack rich, structured breakdowns comparable to core flashcards.
3. The ten **similar examples** shown in grammar notes are passive reference material, **not** interactive child variations with independent progress.
4. The grammar collection is keyed to **one category per card**; it cannot yet reuse one core card in multiple relevant pattern sessions without architectural changes.
5. Speaking is **self-rated**; do not imply speech is automatically transcribed/verified.
6. Current quiz principally grades one selected word ordering. Valid alternatives require explicit, tested handling; do not mark natural Dutch as wrong just because it differs from a single model.
7. Current grammar pattern source/build process is fairly simple and has no durable richer lesson schema, review provenance, or automated grammatical-coverage matrix.
8. Dutch-first/mixed Think in Dutch learning is partly implemented in older Learning Hub; unify UX rather than creating conflicting, disconnected systems.

## 2.4 Frozen Academy curriculum rule

The separate **Nova Dutch Academy Official Grammar Curriculum v1.0** is **approved/frozen**. Its instructional philosophy is: one topic at a time, explain why, practice realistic scenarios, recycle old topics, pass promotion at **90%+**, and record mastery/review. Expanding DutchTap's app categories **does not amend** that curriculum. If a change to the curriculum itself is wanted, draft a formal change request (CR); don't silently add or renumber curriculum modules. Existing DutchTap per-card four-level ratings / ten-streak retirement are **not the same** as an Academy 90%-promotion test. Keep those systems conceptually distinct until specifically integrated.

---

# 3. Pedagogical rules — non-negotiable

1. **Why before how:** explain function and intuition, structure/pattern, English contrast, examples, then drills.
2. **One targeted pattern first**, followed by early **controlled interleaving** of previous patterns and later uncued mixed practice. Do not permanently isolate each conjunction.
3. **Real-world situations:** home, supermarket, phone calls, municipality, office, meetings, IT support, systems, cloud and troubleshooting; use Flemish/Belgian contexts where helpful. Avoid artificially forced sentences.
4. **Sentence production first:** Spoken/self-constructed response is at least as important as selecting shuffled words. Dutch-first prompt by default in appropriate modes; hints are optional and can fade with progress.
5. **No answer leakage:** don't show the exact model Dutch sentence or the necessary conjunction in advanced recall prompts. Show grammatical hints for beginners when requested.
6. **Clear boundaries:** distinguish the lesson-wide explanation, sentence-specific analysis, passive similar examples, and optional interactive child variations.
7. **Precise terminology:** main clause (`hoofdzin`), subordinate clause (`bijzin`), subordinating conjunction (`onderschikkend voegwoord`), finite verb (`persoonsvorm`), verb cluster (`werkwoordelijke eindgroep`), inversion (`inversie`), separable particle (`scheidbaar deel`).
8. **Avoid false universal rules:** a simple subordinate clause commonly has a finite verb at the end; multiple verbs form an end cluster and **order within the cluster can vary**. Do not assert the finite verb is invariably the absolute last word.
9. **Explain contrasts, not absolutes:** `als` can mean *if* or *when*; `wanneer` can also express conditions (often more formal); `toen` covers a past occasion/period, while repeated past contexts often use `als`; regional/formal usage deserves notes when relevant.
10. **Grammar tagging must be justified:** a card may train multiple patterns, but its tag must reflect the **actual grammar** and the learner's intended skill, not a crude text search for words.
11. **Faithful prompts:** scenario, accepted Dutch answer, English meaning and explanation must agree. A model must never contradict its scenario or introduce unintended facts.
12. **Transparent review status:** machine/content tests and AI editorial checks are not native-speaker certification; maintain provenance and unresolved-review queue.

---

# 4. Detailed learner experience (acceptance contract)

## 4.1 Entry/navigation

- Keep the familiar **Grammar Patterns** tile grid and recognisable short labels.
- Group navigation optionally by **Sentence Structure**, **Conditions**, **Time**, **Reasons/Results**, **Reporting/Questions**, **Relative Clauses**, **Verb Structures**, **Mixed Grammar**; do not hide direct access to Als, Toen, Omdat, etc.
- Tiles show an accurate count of **unique available practice cards**, optionally with a secondary label for linked existing sentences and child variations. Avoid counting passive examples as independent playable cards.
- A tile opens a grammar-focused practice setup, not a disconnected new app; preserve/back navigation and `?new=grammar:<topic>` compatibility.
- Show clear topic objective, recommended level, and optional “Learn the rule” action before a session.
- Respect mobile portrait layouts, long Dutch sentences and keyboard/screen-reader accessibility.

## 4.2 Collapsible topic-level grammar lesson

A **single detailed lesson per grammar topic**, not 100 duplicated long essays. Must be openable at **creation**, **Study**, **Speaking**, and **Quiz**, without losing card position or answer draft. Default collapsed during active recall; optionally open by default the first time studying a topic. Persist preference sensibly per topic/session.

Each topic lesson MUST contain:

- [ ] Purpose: what this construction communicates, and **why Dutch uses it**.
- [ ] Natural English comparison and relevant Dutch terminology.
- [ ] A clear base rule and a **visually segmented** formula showing subject, finite verb, other elements, and particle/verb cluster.
- [ ] Main-clause-first **and** subordinate-clause-first examples; explain resulting main-clause **V2 inversion**.
- [ ] Direct vs indirect questions where relevant.
- [ ] Present / simple past / perfect / future examples where natural.
- [ ] Modal-verb and multiple-verb end-cluster examples with nuance, not oversimplified absolute rules.
- [ ] Separable-verb interaction where relevant.
- [ ] Confusable conjunctions and meaning differences (e.g. Als vs Toen vs Wanneer; Omdat vs Want vs Daarom; Tot vs Totdat).
- [ ] A common-mistakes section with **wrong → corrected → why**; never present artificial errors as valid examples.
- [ ] Multiple genuine everyday and workplace/IT examples, with English meanings and Dutch TTS playback.
- [ ] A quick “recognise the pattern” recap and optional mini self-check.
- [ ] Keyboard and screen-reader accessible disclosure, adequate contrast, no content jump that resets session state.
- [ ] Content review/source references where needed; meaningful version identifier.

**Initial gold-standard lesson: ALS.** It must thoroughly cover *if*, *when*, *whenever*, the subordinate pattern, subordinate clause before/after main clause, V2 inversion, repeated present/past, future-time usage with present tense, verb clusters, separable verbs, and contrasts with `wanneer` and `toen`.

## 4.3 Study mode — for every grammar card

- [ ] Show Dutch sentence, natural English translation, playback, and topic label.
- [ ] Show the **topic-level collapsible lesson** in addition to—not instead of—sentence-specific notes.
- [ ] Each sentence gets a structured **step-by-step breakdown**: clause boundaries; word/phrase meanings; subject; finite verb; word order; main clause vs subordinate clause; why inversion; why conjugation/tense; separable particle behavior where applicable.
- [ ] Include *correct vs common error* plus a **specific** explanation for this sentence, not a generic boilerplate sentence pasted on every card.
- [ ] Include contextually relevant examples that illustrate the same rule, with faithful translations and playable Dutch device speech.
- [ ] In a fixed session, Next cycles through the same selected base cards; shuffling only changes order, not membership.
- [ ] Preserve progress/state when opening/closing lessons or switching modes.

### Gold-standard sentence example

**Dutch:** `Als het verslag klaar is, stuur ik het naar mijn manager.`  
**English:** “When the report is ready, I send it to my manager.”  
**Part A:** `Als | het verslag | klaar | is` = conjunction + subject + predicate + finite verb.  
**Part B:** `stuur | ik | het | naar mijn manager` = V2 finite verb + subject (inversion) + object + recipient/direction.  
**Common errors:** `Als het verslag is klaar, ...` (wrong subordinate order); `... ik stuur ...` after fronted Als clause (missing inversion).  
**Contrast:** `Ik stuur het naar mijn manager als het verslag klaar is.` (main clause first; no main-clause inversion).  
**Important:** Introductory examples should be simple and natural; complex exceptions belong in advanced notes, not omitted forever.

## 4.4 Speaking / “Say it yourself”

- [ ] Show a **realistic situation and communicative goal**, not only “translate X”.
- [ ] Have a **Dutch-first** prompt option, English support toggle, and context clues appropriate to level.
- [ ] Keep Dutch model hidden until user chooses to reveal; no automatic answer leakage.
- [ ] Allow the learner to **say an answer aloud**, self-evaluate, reveal model answers, read why each works, then rate Difficult / Medium / Easy / Mastered.
- [ ] Accept/display **genuinely equivalent** alternative natural answers with their own meanings/usage notes; distinguish alternatives that change emphasis, time, politeness or meaning.
- [ ] Early guided practice may say “use Als / start with Als”; advanced/mixed prompts must **remove the cue** and require selecting the construction.
- [ ] Consistently repeat weak grammar structures in later practice without discarding the learner's fixed base-session membership.
- [ ] Keep existing explicit self-rating semantics until optional speech-recognition work is independently designed/consented to.
- [ ] Do not punish speech responses through unreliable text matching; a future speech-recognition system requires separate accuracy evaluation and consent.

## 4.5 Quiz, word-order and mistake correction

- [ ] Keep existing word-tile ordering game and progress/points behaviors.
- [ ] Show the scenario, not a Dutch answer, until submission.
- [ ] After submission, explain **why** the model word order works, especially for subordinate-end position and inversion.
- [ ] Support additional **find-and-fix-the-mistake** challenges (wrong finite verb placement, missing inversion, separable particle mistakes, tense/auxiliary errors). A separate mode or controlled question type is fine.
- [ ] Allow optional **typed answer** / sentence construction where available; communicate clearly which kinds of variants can be automatically graded.
- [ ] Where a task explicitly allows two clauses in different orders, design multiple accepted model answers or rotate a clearly identified target; do not randomly mark other natural forms as incorrect.
- [ ] Do not automatically accept wrong tense or meaning simply because word order is technically grammatical.
- [ ] Persist selected models, tile order and outcomes across refresh; avoid double awarding points from replay/history.

## 4.6 Interactive “Extra variations”

- [ ] Extend the **existing** parent-child variation control to the grammar collection; reuse UX instead of inventing another unrelated toggle.
- [ ] Each parent gets **up to ten appropriate interactive variations**, with their own correct Dutch, faithful English, scenario, intended target structure, detailed explanation, and separate difficulty/progress. Do not automatically promise ten meaningful children for every card if content cannot be verified; track exceptions transparently.
- [ ] Variations should deliberately contrast: main-first/subordinate-first, person, time, tense, negation, modal, separable verb, combined patterns, formal/informal as appropriate.
- [ ] Variations are **off/optional initially**, or follow a clearly documented and tested inherited/mastered setting; never silently multiply the learner's workload.
- [ ] When enabled, children enter Speaking and Quiz under existing progressive-release behavior; do not replace the fixed base-card set or unexpectedly exceed session limits.
- [ ] Preserve child IDs, difficulty and previously completed progress after toggling off/on and syncing between devices.
- [ ] TTS uses the appropriate **Dutch/Belgian voice if available**; no image or paid recording required for variations.
- [ ] Distinguish **passive examples** (read-only inside lesson) from **interactive practice questions** (tracked progress).

## 4.7 Mixed grammar and “Think in Dutch”

- [ ] Start with targeted pattern drills; add optional controlled review of already studied grammar early.
- [ ] Progress toward uncued situations in which the learner chooses the right conjunction/structure.
- [ ] A mixed challenge may combine `als` + V2 + separable verb + perfect or modal constructions; explanation must identify every relevant rule.
- [ ] Include **conjunction-selection contrasts** (`omdat/want/daarom/dus`, `als/toen/wanneer`, `tot/totdat`, `dat/of`, `hoewel/ook al`).
- [ ] Provide **Dutch-only situations** with revealable English hint; realistic shorter spontaneous-response prompts before long complex ones.
- [ ] Mix old and new topics with review priority weighted toward weak patterns; avoid over-exposing mastered items but do not make them disappear forever.
- [ ] Keep the old Learning Hub / Think in Dutch accessible; integrate or share content/engine deliberately, avoiding two divergent sources of truth.

---

# 5. Grammar curriculum of the APP: complete scope and accuracy rules

**Important:** This is the new DutchTap product inventory. It does **not** alter the separately frozen Academy curriculum.

## 5.1 Fundamental word-order patterns to teach

1. Main-clause SVO/V2 (one **constituent** before the finite verb, not necessarily one word).
2. Inversion after fronted adverbs, objects, or entire subordinate clauses.
3. Standard subordinate word order (simple finite verb at the end).
4. Multiple-verb final clusters and acceptable regional/order differences, including modal/perfect/passive cases.
5. Direct questions vs embedded/indirect questions.
6. Separable verbs as finite main-clause forms, past, participles, infinitives, te-infinitives and subordinate forms.
7. Relative clauses, which also trigger subordinate word order but use relative pronouns/adverbs.
8. Coordinating `want`, `maar`, `en`, `of`, `dus` vs subordinating connectors; adverbial `daarom`, `toch` etc. Do not label them all as subordinating conjunctions.
9. Cases that look exceptional, notably `ook al` with verb–subject inversion.

## 5.2 Subordinating conjunctions and closely related structures — coverage inventory

Use this taxonomy for content planning, explanations, selection and validation. **Classify the function of a word in its sentence**: some also function as prepositions, adverbs, interrogatives or relative words.

### Time
- [ ] `als` — when/whenever in relevant contexts.
- [ ] `wanneer` — when; direct-question and indirect-question roles; conditional overlap.
- [ ] `toen` — an occasion/period in the past (contrast habitual past *als*).
- [ ] `terwijl` — while, simultaneous actions.
- [ ] `voordat` — before.
- [ ] `nadat` — after.
- [ ] `totdat` — until.
- [ ] `tot` — until, where introducing a clause; distinguish preposition `tot`.
- [ ] `zodra` — as soon as.
- [ ] `zolang` — as long as/while.
- [ ] `sinds` — since as conjunction vs preposition.
- [ ] `nu` — now that, in its conjunction use.

### Conditions and exceptions
- [ ] `als` — if.
- [ ] `wanneer` — if/when in appropriate register.
- [ ] `indien` — formal if.
- [ ] `mits` — provided that.
- [ ] `tenzij` — unless.
- [ ] `op voorwaarde dat` — on condition that.
- [ ] `voor het geval dat` — in case.
- [ ] `gesteld dat` — supposing that.

### Reasons, causes, goals and results
- [ ] `omdat` — because.
- [ ] `doordat` — cause/owing to the fact that.
- [ ] `aangezien` — given that/since.
- [ ] `daar` — formal since/because.
- [ ] `zodat` — so that / with the result that, dependent on context.
- [ ] `opdat` — formal purpose.

### Contrast/concession
- [ ] `hoewel`, `alhoewel`, `ofschoon` — although, with register notes.
- [ ] `ondanks dat`, `zonder dat`, `behalve dat` — examine actual use and style before authoring.
- [ ] **Compare `ook al` as a separate nonstandard-word-order contrast**: `Ook al ben ik moe, ...`, not `Ook al ik moe ben`.

### Comparisons/manner
- [ ] `alsof`, `zoals`, `naarmate` — distinguish meanings and natural syntax.

### Reporting, complements and indirect questions
- [ ] Conjunction `dat`: `Ik denk dat hij komt` vs demonstrative/relative `dat`.
- [ ] Conjunction `of` (“whether”) vs coordinating `of` (“or”).
- [ ] Indirect interrogatives: `wanneer`, `waarom`, `hoe`, `waar`, `wat`, `wie`, `hoeveel` with embedded verb placement.

### Relative clauses
- [ ] `die`, `dat`, `wie`, `wat`, relative `waar` (and relevant `waar+preposition`), each with real examples and antecedent/role explanations.
- [ ] Contrast with direct questions and demonstrative uses.

### Non-subordinating contrasts required for correct choice
- [ ] `want` vs `omdat`; `daarom`/`dus` vs `omdat`; `maar` vs `hoewel`; `en` vs sequential adverbials.
- [ ] Main-clause V2 after `daarom` vs subordinate verb placement after `omdat`.
- [ ] Some linking expressions are multiword and not equivalent to a single fixed formula. Confirm register and grammar against authoritative references.

## 5.3 Content volume: targets, not guarantees

**Definition of a target:** e.g. “100 Als” means **100 distinct, contextually suitable, directly playable base sentences for the Als topic**, potentially including referenced existing Everyday/Workplace cards. It does **not** mean 100 multiplied copies of the same template; passive related examples and optional child variations must be counted separately. Count unique underlying sentence IDs and distinct meaningful patterns; visibly report linked/reused cards.

| Topic | Baseline | Target playable base cards | Priority |
|---|---:|---:|---|
| V2 & inversion | 20 | 100 | Critical |
| Als | 19 | 100 | Critical — first vertical slice |
| Omdat | 20 | 100 | Critical |
| Dat | 20 | 100 | Critical |
| Toen | 20 | 100 | Critical |
| Wanneer | 0 | 100 | High |
| Separable verbs | 24 | **150–200** | Critical |
| Verb forms in context | 36 | 100 | High |
| Past & perfect | 17 | 100 | High |
| Tot / totdat | 20 (`tot`) | 60–100 combined/structured | Medium |
| Terwijl | 0 | 60–100 | High |
| Voordat / Nadat | 0 | 100 combined | High |
| Zodra / Zolang | 0 | 60 combined | Medium |
| Of (“whether”) | 0 | 60 | High |
| Hoewel / Tenzij | 0 | 60 combined, with distinct subskills | Medium |
| Relative clauses | 0 | 100 | High |
| Indirect questions | 0 | 100 | High |
| Other advanced connectors | 0 | Meaningful coverage; avoid quotas | Later |

**Do not force all topics to 100.** Distinct subskills and correctness are more important than equal numbers. First audit all 1,200 core sentences and all legacy grammar sentences to determine **true reusable coverage**; then write only the missing examples.

## 5.4 Required variety within each major topic

Every topic's coverage matrix must explicitly record these dimensions where linguistically sensible:

- [ ] Main clause before subordinate clause; subordinate clause before main clause; inversion when fronted.
- [ ] Present, simple past, perfect, future-time contexts; repeated vs one-time past where relevant.
- [ ] Singular/plural pronouns and agreement; pronouns vs nouns.
- [ ] Positive/negative; statements vs questions; commands when appropriate.
- [ ] Simple one-verb subordinate clause and more complex verb clusters.
- [ ] Common separable verb inside subordinate clause and in main clause.
- [ ] Everyday, public-service, workplace/IT, conversational scenarios.
- [ ] Contexts demonstrating **contrast** with confusable connectors and non-subordinating words.
- [ ] Multiple natural accepted phrasings only when same communicative meaning remains intact.
- [ ] No duplicate scenario disguised by swapping only a single name; genuine communicative diversity.

---

# 6. Dedicated separable-verb curriculum

**Goal:** teach **why/when separable parts move**, and provide practical breadth of **60–100 genuinely useful separable verbs**, including home and workplace/IT. A smaller curated set across more constructions is better than a bloated inaccurate list. Validate finite forms, participles, auxiliaries, prepositions and usage; do not derive irregular forms blindly.

## 6.1 Mandatory constructions (per representative verb)

For `opsturen`:

| Construction | Correct model | Why |
|---|---|---|
| Present finite main clause | `Ik stuur het verslag op.` | Finite `stuur` in V2; particle `op` later |
| Simple past finite main clause | `Ik stuurde het verslag op.` | Finite past; particle separated |
| Perfect | `Ik heb het verslag opgestuurd.` | Compound past participle, often particle + `ge` + stem |
| Modal + infinitive | `Ik moet het verslag opsturen.` | Whole infinitive attached after modal |
| Simple subordinate clause | `... dat hij het verslag opstuurt.` | Finite verb joined within verb-final subordinate order |
| `te` + infinitive | `Ik probeer het verslag op te sturen.` | `te` between particle and base infinitive |
| Imperative | `Stuur het verslag op!` | Main-clause imperative, particle separated |

- [ ] Show **full explanation**, not only conjugation tables.
- [ ] Explain effects of tense, modality, infinitive, participle and subordinate position.
- [ ] Include reflexive and fixed-preposition cases where appropriate (`zich aanmelden`, `deelnemen aan`, etc.).
- [ ] Include common contrasts with **inseparable** verbs and lookalikes; avoid explaining every verb containing a prefix as separable. Examples of inseparable constructions include `bezoeken`, `begrijpen`, `ontdekken`, `verkopen`, `overwegen` in their common meanings.
- [ ] Explain genuine exceptions/alternative patterns only after teaching the reliable basic pattern; qualify categorical claims about complex infinitive clusters and stress-dependent verbs.
- [ ] Exercise combined `als/omdat/toen` + separable verbs + V2 inversion and different tenses.
- [ ] Include genuine high-frequency home, transport, office, support, DevOps/server verbs; native-check subtle technical usage.

## 6.2 Seed vocabulary to audit and expand (not automatically approved)

`opstaan`, `aankomen`, `weggaan`, `terugkomen`, `opbellen`, `meenemen`, `afmaken`, `opruimen`, `schoonmaken`, `invullen`, `aanvragen`, `instellen`, `aanmelden`, `inloggen`, `uitloggen`, `uitschakelen`, `inschakelen`, `opstarten`, `afsluiten`, `uitvoeren`, `bijwerken`, `nakijken`, `aanpassen`, `terugzetten`, `opslaan`, `uitzoeken`, `doorgaan`, `meedoen`, `deelnemen`, `bijwonen`, `voorbereiden`.

For each verb record store: lemma, meaning(s), usage/register, separable particle, present forms, simple past, past participle, `hebben`/`zijn` auxiliary, optional `te` and modal examples, subordinated form, fixed prepositions and at least one **real-world scenario**. The sentence target of **150–200** is not “all possible forms of 100 verbs”; present a representative form matrix and make more inflections available through exercises/variations.

---

# 7. Content model, reuse, and migration-safe architecture

## 7.1 Proposed domain concepts (schema design before coding)

Create clear, testable content objects; names are illustrative, not mandatory:

- **GrammarTopic**: stable `topicId`, title, family, priority, pedagogical objectives, prerequisite topics, rich collapsible lesson sections, source/review metadata, version.
- **GrammarPatternTag**: `topicId`, narrower subskill (e.g. `als.condition`, `als.habit`, `als.fronted-inversion`), why tagged, source card ID, manual/review provenance.
- **PracticeCard**: stable original ID, correct Dutch, faithful English, scenario (Dutch/English where available), accepted models, detailed per-card analysis, audio status, reviewed status.
- **GrammarSessionSelection**: fixed **set of unique parent card references**, origin collection, selected practice topic(s), starting difficulty; source card contents resolved through one registry.
- **Variation**: stable child ID/parent reference, contrast focus, Dutch/English scenario, model(s), note, own progress, unlock state.
- **Progress / review record**: preserve original card progress and per-child progress; decide explicitly whether **grammar skill mastery** uses `(cardId, topicId)` rather than assuming recalling a phrase means mastering every grammatical skill it contains.

## 7.2 One sentence may train several topics

- [ ] Tag a sentence with **multiple appropriate topics** (e.g. `Als de server uitvalt, controleer ik de logs` → `als`, `inversion`, `separable`).
- [ ] Reuse existing Everyday and Workplace card content **by ID/reference**; no independent clones of the same underlying card.
- [ ] Preserve origin IDs and historical meanings; do not break direct sentence links, audio/image paths or prior session restores.
- [ ] Create a **derived grammar topic index** for search/selection rather than assuming `card.category === topic`.
- [ ] Refactor strict existing session rules (`collection`, `category`, `validTopic`, card eligibility) carefully to allow cross-collection referenced cards **only when a grammar session intentionally selects them**.
- [ ] Decide, document and test mastery semantics: original base-card knowledge can be reused, but **pattern-specific understanding should not be falsely inferred** solely from its existing “Mastered” label.
- [ ] Do not show the same underlying sentence twice in one session merely because it bears multiple tags; count distinct IDs.
- [ ] Ensure new cards and linked historical cards remain available to active sessions over deployments and content migrations.
- [ ] Preserve 5-active-session limit, 100-parent-card limit, language immutability, guest/account boundaries and local-first sync.
- [ ] Avoid storing large repeated lessons in per-user MongoDB session documents; keep versioned read-only lesson content in app assets.

## 7.3 Source of truth and generators

- [ ] Inventory actual source corpus and identify existing reusable cards **before** generating additions.
- [ ] Create versioned **topic lesson** source data (JSON/Markdown or TypeScript with a typed schema) separate from per-sentence notes.
- [ ] Expand canonical grammar-pattern sentence sources, never hand-edit generated `data/grammar-pattern-cards.json` / `data/grammar-pattern-notes.json` as the only authoritative copy.
- [ ] Improve `scripts/build-grammar-patterns.py` (or a justified replacement) for stable IDs, controlled tags, rich notes, alternatives, meaningful coverage metadata, explicit exceptions and provenance.
- [ ] Generator must be deterministic: running it twice with unchanged inputs gives identical output/content hashes; no random IDs or unstable ordering.
- [ ] Preserve all existing `pat-*` IDs, their canonical sentences and historical progress unless there is an explicit reviewed correction/migration. Never renumber original `pat-*` cards when adding new source rows.
- [ ] If corrections to previously learned sentences are necessary, record what changed and preserve compatibility with saved attempts/answer IDs.
- [ ] Programmatically detect exact duplicates, semantic near-duplicates, mismatched English/scenarios, impossible alternate models, accidental tag inflation and coverage gaps.
- [ ] Keep legacy `/learn` tasks, main flashcards, French mode and old content overlays functioning.

## 7.4 Required card-level explanation shape

For every new grammar practice card:

1. Scenario and communication goal (Dutch preferred, English support available).
2. Primary correct Dutch and faithful English meaning.
3. Optional approved alternatives, with **why/when they are acceptable**.
4. Clause segmentation; main vs subordinate vs relative vs indirect question.
5. Labels for conjunction, subject, finite verb, objects, adverbials, participles, particles and verb cluster as applicable.
6. **Why this word order** in plain English; comparison to normal main-clause order.
7. Inflection/tense/auxiliary note where relevant.
8. One credible common mistake with accurate correction and explanation; second mistake if two distinct mechanisms are at issue.
9. Relevant passive examples and optional child variations, each distinct and translated.
10. Provenance, editorial-review status and version/hash for later re-review.

---

# 8. Content quality, research and review protocol

- [ ] Base grammar assertions on **authoritative Dutch/Flemish guidance** where issues are subtle (e.g. Onze Taal, Taaladvies/Vlaanderen, recognised Dutch grammars). Record source URL, rule and date in topic notes where needed; do not paste unverified citations.
- [ ] Prefer natural modern **Belgian Dutch-compatible** examples, not mechanically translated English. Mark appropriate register and any Netherlands/Flanders differences.
- [ ] Manually/editorially validate **every** new base sentence and its **own** scenario, English meaning, explanation and accepted answers—not just a grammar-family template. Record exactly what was inspected.
- [ ] Review every interactive variation independently, including its distinct scenario, target structure, explanation and accepted model(s).
- [ ] Do not mark AI-reviewed content as independently native-speaker verified. Maintain honest `reviewStatus`, `independentHumanReview`, reviewer/date/hash if applicable.
- [ ] Run/reconcile the repository's existing unfinished communication/grammar/example review backlog without falsely asserting it is complete. `npm run content:review-check` was documented as intentionally failing while that previous audit remains unfinished; distinguish **new-feature gates** from **pre-existing open review debt** and never claim both are clean if they aren't.
- [ ] Ensure quizzes do not treat valid alternative Dutch as grammatical failure merely because it isn't the canonical string. Display “not one of the currently recognised answers” rather than “wrong Dutch” where appropriate.
- [ ] Cover negation (`niet`/`geen`), clause attachment, tense, agreement, subject/recipient, modal clusters and prepositions relevant to the target sentence.
- [ ] If content cannot be made natural or pedagogically meaningful, **exclude it and report the shortfall** rather than pad toward 100.

---

# 9. Delivery phases and explicit task checklist

**Workflow:** Implement one vertical slice at a time, validate it completely, then extend shared components and corpus. Avoid making simultaneous changes to the entire app and then discovering the session engine is broken.

## P0 — Baseline, inventory and design contract

- [ ] Read this plan, current repo files and frozen Academy curriculum notes.
- [ ] Record current branch/commit SHA, existing grammar counts, 1,200-core-card count, tests available, CI status and known failures.
- [ ] Audit current 196 grammar cards: canonical IDs, scenarios, notes, duplication, common mistakes, accepted alternatives and actual grammar tagging.
- [ ] Scan all existing core cards to produce initial **grammar tag/coverage candidate report**, including evidence for reused sentences.
- [ ] Design type/schema and storage migration for topic lessons, referenced core cards, tags, variant IDs and per-skill mastery.
- [ ] Write implementation-specific schema/decision record; identify how existing active sessions will remain valid.
- [ ] Confirm deployment workflow on branch and Vercel, avoiding unnecessary preview/storage churn.
- **Gate P0:** inventory and architecture decisions exist; no progress reset or unreviewed migration risks left unexamined.

## P1 — First complete vertical slice: ALS

- [ ] Author a comprehensive, **fact-checked** ALS lesson (§4.2), from beginner rule to mixed-verb/meaning nuances.
- [ ] Create responsive collapsible topic explanation available in session creation, Study, Speaking and Quiz.
- [ ] Implement richer per-card structured breakdown, error contrasts and listening controls.
- [ ] Build and review **100 distinct playable ALS parent cards**, preferentially reusing suitable old cards by reference; count and label those sources.
- [ ] Ensure representative contexts: if, when, whenever, present, habitual past, finite verb-final, inversion, first/second main position, separable verbs, modals, perfect, meaningful negative/IT examples.
- [ ] Implement Dutch-first scenario-based Speaking with optional English support and multiple *true* accepted answers.
- [ ] Make grammar-card extra variations **interactive**, separately rated and conditionally enabled, without breaking existing core variations.
- [ ] Validate word-order Quiz plus sentence-specific feedback and legitimate alternative handling.
- [ ] Create end-to-end automated test: select 10 ALS cards → study → speak/reveal/rate → quiz → toggle variations → refresh → return → sync/guest; current selection and progress persist.
- **Gate P1:** the ALS flow passes content QA, desktop/mobile interaction tests, and persistence tests. The product can be demonstrated end-to-end without pretending other topics are finished.

## P2 — Expand core sentence order / common subordinators

- [ ] V2 and inversion → 100 playable cards.
- [ ] Omdat → 100; distinguish `want` and `daarom` word order.
- [ ] Dat → 100; contrast conjunction, demonstrative and relative uses, and embedded statements.
- [ ] Toen → 100; one-time past vs period vs habitual-past `als`.
- [ ] Wanneer → 100; time/condition + direct question/indirect question.
- [ ] Add **mixed word-order identification and repair** exercises, including inversion after fronted subordinate clauses.
- [ ] Add target-level tests for simple subordinate-final form and realistic multiple-verb exceptions/order.
- [ ] Expand review/prerequisite logic: completed patterns appear in later mixed practice.
- **Gate P2:** each major topic has its own *accurate* lesson and counted/reviewed coverage; mixed choices are not spoon-fed by conjunction labels.

## P3 — Separable verbs and verb structures

- [ ] Curate, verify and document **60–100 useful separable verbs**, prioritising those the learner will actually use.
- [ ] Add detailed **separable-verb lesson**, visual particle movement and `ge`/`te` rules with qualifying notes.
- [ ] Deliver **150–200** reviewed separable-verb sentence cards, with representative variety by verb and grammatical construction; report verb coverage separately from card count.
- [ ] Expose per-verb forms and examples, including finite present, simple past, perfect, modal+infinitive, subordinate, `te`+infinitive and imperative where appropriate.
- [ ] Contrast inseparable/lookalike verbs and identify fixed prepositions (`deelnemen aan` etc.).
- [ ] Expand other Verbs in Context to 100 and Past & Perfect to 100 with auxiliary/tense rationale.
- [ ] Add cross-pattern tests: subordinate clause with a separable finite verb vs main-clause separation and perfect forms.
- **Gate P3:** verb dictionary accuracy and representative grammatical coverage verified, not just headline card totals.

## P4 — Extended subordinate patterns, indirect questions, relative clauses

- [ ] Tot/Totdat to 60–100 combined/structured with correct preposition-vs-conjunction explanations.
- [ ] Terwijl to 60–100; Voordat/Nadat to 100 combined; Zodra/Zolang to 60 combined.
- [ ] `of` (whether) 60; embedded/indirect questions 100.
- [ ] Hoewel/Tenzij 60 combined (with clear separate subskills and contrasting `ook al` behavior).
- [ ] Relative clauses 100 (`die`, `dat`, `wie`, `wat`, `waar`) and contrasts with indirect questions/demonstratives.
- [ ] Add meaningful, reviewed coverage for additional advanced conjunctions listed in §5.2, without arbitrary padding.
- [ ] Update coherent topic grouping/navigation while preserving direct individual tiles and links.
- **Gate P4:** advanced categories are accurately classified (not everything is wrongly called a subordinating conjunction) and comprehensive enough for realistic usage.

## P5 — Reuse existing corpus, progressive mixed mastery

- [ ] Finish source-card tagging across Everyday, Dutch at Work and Grammar cards with manual review of uncertain matches.
- [ ] Ensure one underlying card can appear in multiple relevant grammar-topic inventories, **without duplicate content or duplicate selection within the same session**.
- [ ] Implement intelligent mixed practice / Think in Dutch with Dutch-first contextual prompts and optional English help.
- [ ] Weight weak grammar patterns more heavily and mastered skills less frequently, without hiding mastered topics permanently.
- [ ] Include mixed combinations: `als` + separable + inversion; `omdat` + perfect; `toen` + past; `dat` + modal; indirect questions + verb clusters.
- [ ] Distinguish full real mastery from memorising a known original sentence; include novel contexts.
- [ ] Ensure progress semantics are accurate across multiple tagged topics, sessions and languages.
- **Gate P5:** mixed real-life question requires the learner to select grammatical form without seeing the target conjunction; session and progress systems remain correct.

## P6 — Polish, accessibility, integration and stability

- [ ] Mobile-first UI; inspect 320/375/430 px widths, tablet and desktop, long explanations and collapsibles.
- [ ] All important controls reachable by keyboard; semantic headings and disclosures; labels for audio, reveal, rating, more variations; focus management on modals and card transitions.
- [ ] Accessibility/reduced motion/high contrast; audio/celebration settings continue to work.
- [ ] Offline assets and network-first updates: ensure lessons and required grammar text are available offline according to existing app expectations; no broken caches after deploy.
- [ ] Dutch device-voice selection with suitable `nl-BE` preference when available, fallback reporting; do not accidentally speak Dutch in a French voice or promise recorded audio where none exists.
- [ ] Unchanged account/login/recovery/guest merge, de/het games, French flashcards, progress/stats, old lab URLs, and existing storage.
- [ ] Add topic progress information and honest review/mastery indicators; avoid making main screen excessively crowded.
- [ ] Update all relevant documentation (architecture, Grammar Patterns, learning hub, content authoring and migration notes).
- **Gate P6:** responsive, accessible, stable, reversible release candidate.

## P7 — Independent cross-check, evidence and release

- [ ] Cross-check **every checklist item in §§3–10 and §12** against actual implemented files/UI/tests; mark Verified, Partial, Blocked or Deferred with evidence.
- [ ] Recount all card totals **programmatically**, separately reporting unique parents, reused references, passive examples, interactive variations and distinct verbs.
- [ ] Sample and thoroughly inspect each topic's language/grammar and a stratified selection across every subpattern; full source/editorial review is required for each new item.
- [ ] Run all relevant tests, report exact result/commit/config. No “all tests pass” claim without run output.
- [ ] Test upgrade/migration with saved old sessions and histories, then account cross-device sync and guest merge.
- [ ] Manually walk full ALS, Toen, Wanneer, Omdat, Dat, separable and mixed flows in a browser.
- [ ] Review change diff, document regressions/deferred items and confirm rollback plan.
- [ ] Only then merge/deploy according to repo's Git/Vercel policy. Do not merge a partial implementation solely to reach the quota.
- [ ] Complete the **Final Coverage and Evidence Matrix** (§12); explicitly say what is not complete.
- **Gate P7:** no hidden unchecked work; product complete only to the stated verified scope.

---

# 10. Test and audit requirements

## 10.1 Automated tests to add

- [ ] Topic-lesson schema completeness; missing sections/malformed content rejected with actionable error.
- [ ] All topic IDs/grammar tags resolve; invalid cross-collection membership fails safely.
- [ ] Exact duplicate detection and count assertions with separate parent/ref/variation totals.
- [ ] Build output deterministic; historical grammar `pat-*` IDs stable on regeneration.
- [ ] Every model has a non-empty scenario, faithful meaning, targeted rule and reviewed status; every child variation has independent metadata.
- [ ] `als`, `omdat`, `dat`, `toen`, `wanneer`, `terwijl`, `of` (whether), relative `die/dat`: representative correct/incorrect order cases.
- [ ] `ook al` exception and `want`/`daarom` coordination/adverb contrasts; no naive substring-based tagging.
- [ ] Separable forms for main present, past, perfect, modal, subordinate, `te`-infinitive and negative cases; verify inseparable contrasts.
- [ ] Sentence/session selection counts and uniqueness; cannot request more unique cards at selected level than available.
- [ ] Fixed selected cards across Study/Speaking/Quiz, including linked core cards.
- [ ] Alternatives graded/presented consistently; no unwarranted “wrong Dutch” verdict.
- [ ] Toggle interactive variations: unlock, independence, progress, disable/re-enable, refresh, sync, retire behavior.
- [ ] Existing account/guest storage, idempotent actions, server compare-and-swap, session limits and language boundaries.
- [ ] French-language sessions never get Dutch-only grammar content; old historical sessions remain readable.
- [ ] Repeated reveal/replay/history never awards points or increments mastery twice.

## 10.2 Manual browser scenarios

1. **First-time learner:** open Als, expand full lesson, listen, read word-order diagrams, collapse, start 10-card Difficult session.
2. **Study:** inspect clause labels and scenario meaning; next, back, refresh, switch to Speaking without losing cards.
3. **Speaking:** answer freely from a Dutch situation; request English support; reveal two permissible alternatives; correctly rate; repeat a weak pattern.
4. **Quiz:** rearrange an Als sentence; get targeted correction explaining *both* subordinate-final word order and inversion; try a wrong answer.
5. **Variations:** enable extra questions and practice a new `als + separable` situation; verify independent level and optional disable.
6. **Mixed:** after practising Toen/Als/Wanneer, get a scenario with no explicit conjunction hint and choose correctly.
7. **Legacy:** open pre-existing Everyday/Workplace/French session; verify same IDs, progress, images, audio, stats, achievements and navigation.
8. **Cross-device / offline:** logged-in account sync and guest state; disconnect, reopen a lesson, resume, reconnect without duplicated actions.
9. **Accessibility:** keyboard-only reveal/collapse, focus restored, screen-reader labels, reduced motion, small screen.

## 10.3 Existing project commands (verify current scripts before use)

```bash
python3 scripts/build-grammar-patterns.py
npm run lint
npx next typegen
npx tsc --noEmit
npm test
npm run content:learning-check
npm run content:audit
npm run content:workplace
npm run assets:flashcards
npm run build
npm run test:flashcards
```

Additional checks: `npm run content:review-check` is an important editorial gate but may still fail from **documented pre-existing unfinished review work**. Log exact cause instead of misreporting the whole feature as reviewed. Use appropriate project test configuration and report environment limitations. Add focused new grammar/lesson/variation tests alongside these commands.

---

# 11. Work protocol: keeping this file as the project memory

At the **start of every implementation session**:

1. Read this master plan and the most recent Work Log entry. Confirm current repo branch/head SHA.
2. Check whether requirements or files have changed since the last session; reconcile without silently deleting a requirement.
3. Identify the **smallest unfinished phase/item** and its tests. Explain what it will change and **why** before coding.
4. Work on a review branch unless the user's explicit Git workflow says otherwise. Protect production and avoid accidental Vercel preview builds.
5. Update the relevant checkboxes **only after implementation and verification**. Record test evidence and accurate content counts.
6. End with **Done / Still open / Failing / Next**. Never claim background progress or completion without actual work.

At the **end of each phase**:

- Re-read the phase gate and every global non-negotiable requirement.
- Compare code/content changes to original baseline and test historical ID compatibility.
- Add a Work Log record using the template below.
- Carry remaining `[ ]` items forward, visibly; mark `[~]` for partial only in the Work Log, not as a completed checkbox.
- Record decisions affecting schema, practice scoring, content or deployment in the Decision Log. If a decision contradicts this baseline, create a versioned amendment rather than silently editing requirements away.

### Work Log template (copy for each actual work session)

```markdown
### YYYY-MM-DD — P# / Work item / commit SHA
**Status:** Not started | In progress | Verified | Blocked | Deferred
**What changed:**
- ...
**Files/links:** ...
**Why/decision:** ...
**Evidence/tests (command → result):**
- ...
**Card/content counts (parents / linked core / variations / distinct verbs):** ...
**Regression checks and migration result:** ...
**Known issues and unfinished requirements:**
- [ ] ...
**Next specific task:** ...
```

### Decision Log template

```markdown
| Date | ID | Decision | Alternatives rejected | Reason | Files/tests impacted |
|---|---|---|---|---|---|
```

---

# 12. Final coverage and evidence matrix — MANDATORY SIGN-OFF

**Rule:** This matrix is the final audit, not a substitute for the detailed checklists. On completion, fill in status, exact evidence (file/line/commit/test), and unresolved items. Until then all statuses are **PENDING**. The implementation cannot be declared fully complete while any required row is Pending, Partial or Blocked.

| ID | Requirement | Status | Evidence / test / content count |
|---|---|---|---|
| A01 | Full collapsible topic lesson reachable in all practice modes | PENDING | — |
| A02 | ALS gold-standard lesson, correct and complete | PENDING | — |
| A03 | Detailed per-sentence clause and word-order breakdowns | PENDING | — |
| A04 | Common errors and meaningful contrast examples | PENDING | — |
| A05 | Scenario-based Dutch-first Speaking + optional English | PENDING | — |
| A06 | Multiple legitimate answer models with explanations | PENDING | — |
| A07 | Word-order Quiz feedback and mistake-correction tasks | PENDING | — |
| A08 | Interactive independently tracked extra variations for grammar | PENDING | — |
| A09 | Existing-card reuse with multi-topic grammar tagging | PENDING | — |
| A10 | Fixed session membership, selection counts and eligibility | PENDING | — |
| A11 | Per-pattern/child mastery tracking, no false cross-skill credit | PENDING | — |
| A12 | Core 100-card targets met or honest shortfalls reported | PENDING | — |
| A13 | Extended subordinate clauses and non-subordinating contrasts | PENDING | — |
| A14 | 60–100 verified separable verbs and 150–200 practice cards | PENDING | — |
| A15 | Separable forms: finite, past, perfect, modal, subordinate, te | PENDING | — |
| A16 | Progressive uncued mixed grammar / Think in Dutch | PENDING | — |
| A17 | Natural Dutch, faithful English and actual review provenance | PENDING | — |
| A18 | Deterministic generator, stable IDs, duplicate/coverage audit | PENDING | — |
| A19 | Existing sessions/history/sync/guest/offline preservation | PENDING | — |
| A20 | French, de/het and other games regression-free | PENDING | — |
| A21 | Mobile accessibility, Dutch device audio, reduced motion | PENDING | — |
| A22 | Unit/integration/e2e/browser tests and build results recorded | PENDING | — |
| A23 | Docs updated, migrations and rollback documented | PENDING | — |
| A24 | Freeze rule for separate Academy curriculum respected | PENDING | — |
| A25 | Final independent re-read and requirement-by-requirement audit | PENDING | — |

### Required closing report format

**Baseline→final counts:** existing/new/linked unique parent cards by topic; passive lesson examples; interactive child variations; verified distinct separable verbs.  
**Completed:** list only verified acceptance IDs with supporting evidence.  
**Partial/Blocked/Deferred:** list IDs with reason and explicit remaining action.  
**Tests:** exact commands, pass/fail, known environmental limitations.  
**Regressions/migrations:** evidence and rollback instructions.  
**Editorial accuracy:** what was reviewed by whom; no false native-speaker claim.  
**Deployment:** branch/PR/merge/production state and live smoke test if deployed.  
**Final verdict:** `COMPLETE` only if all mandatory items genuinely verified; otherwise `PARTIALLY COMPLETE`.

---

# 13. Open design decisions to resolve during P0 (do not silently assume)

| ID | Design question | Initial preferred direction |
|---|---|---|
| D01 | Are reused core-card levels shared automatically across grammar topics? | Preserve existing card review; track topic skill separately rather than equating phrase recall with conjunction mastery. |
| D02 | Should lessons open automatically? | Open for first topic onboarding; collapsed by default during active speaking/quiz; user-controlled thereafter. |
| D03 | What is the default prompt language? | Dutch-first for spontaneous-grammar mode; clear English support toggle; guided English scenarios remain possible initially. |
| D04 | How are alternative word orders graded in tile/typing quizzes? | Explicit accepted-model metadata and transparent focus, no naive universal string equality. |
| D05 | How many children per parent? | Up to ten meaningful variations; no mechanical filler. Follow existing progressive release and preserve independent difficulty. |
| D06 | How to prevent reused-card count inflation? | Deduplicate by underlying stable ID **within a session**; show counts for base and linked sources separately. |
| D07 | How much mixed practice should be mandatory? | Early optional controlled mixing; increase uncued frequency after successful targeted practice. |
| D08 | How to preserve legacy sessions when schema changes? | Versioned parser/migration, stable IDs and historical regression fixtures; avoid destructive updates. |
| D09 | Should this app project alter the Academy frozen curriculum? | **No.** Only via approved Academy change request. |
| D10 | Who verifies natural Dutch? | Record AI editorial checks as such; human-native review only when truly performed. |

---

# 14. Source notes and traceability

**Agreed product decisions:** User's October 25, 2026 DutchTap discussion and existing Grammar Patterns screenshot. Specific requests: detailed collapsible explanations like the Als teaching answer; many more cards (approximately 100 per major topic); per-card detailed explanation; real-life Say It Yourself scenarios; extra interactive variations; reuse existing main flashcards; comprehensively teach subordinators, word-order changes and separable verbs; systematically cross-check work against this file.

**Repository baseline:** Direct inspection of `EtiDavid/dutchtap` main branch on 25 October 2026, especially paths listed in §2.2. Treat baseline counts as a dated snapshot, not permanent invariants.

**Separate source:** `Nova_Dutch_Academy_Official_Grammar_Curriculum_v1.0_FINAL.md` (approved/frozen); only used for methodology and change-control constraints, **not silently modified**.

**Research to verify while implementing:** actual Dutch/Flemish grammar details using reputable language authorities (e.g. Taaladvies on vlaanderen.be, Onze Taal, recognised grammar resources), alongside focused editorial verification of every new scenario and model.

---

# 15. Initial work log

### 2026-10-25 — Plan baseline authored

**Status:** Planning document created; implementation not started.  
**What changed:** Requirements translated into a phase-by-phase spec, content inventory, architectural risks, UX acceptance criteria, grammar scope and final sign-off matrix.  
**Files:** This Markdown plan only.  
**Evidence:** Repo source inspected during planning; no build/tests performed for this document.  
**Outstanding work:** **Every** implementation checkbox and final sign-off remains unchecked/pending.  
**Next task:** P0 inventory + architecture decisions, then a complete ALS vertical slice (P1).  
**Production impact:** None; no repository/app change or deployment performed as part of creating this local planning file.
