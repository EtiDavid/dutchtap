# DutchTap — Grammar Teaching Exemplars and Quality Rubric
**Companion to the approved master plan DUTCHTAP-GRAMMAR-PLAN-001 v1.0.**
**Audience:** Claude Code implementing the app, its editorial content and QA.
**Status:** Prescriptive *style and reasoning examples*, not a claim that any card is already published, independently certified, or all grammar alternatives are interchangeable.

## Who we are teaching — do not miss this

The learner understands classroom Dutch and recognizes lots of written sentences, but freezes during live conversation because they draft an answer in English first and mentally translate it. They especially struggle with Dutch structures unlike English: verb-second (V2), inversion, subordinate verb placement, verb clusters, separable verbs, negation and choosing the right conjunction. Fast everyday Flemish is challenging. Relevant contexts: home and relationships, shops, phone calls, appointments, local Belgian administration, job interviews, office conversations, IT support, Windows/AD, networking, infrastructure, cloud and DevOps.

**The aim is not to memorize 1,000 isolated translations. It is to spontaneously select the right structure in Dutch.** Teach the logic first; then provide contextual contrasts, retrieval practice and feedback. Start with short Dutch-first scenarios, scaffold only on request, then mix topics without giving away the conjunction. No countdown timers or automatic pronunciation scoring in this release.

## Absolute lesson style rules

1. Every explanation should answer **what the speaker is trying to communicate, why Dutch structures the sentence that way, and what changes when the context changes**. Not just "the verb is at the end".
2. Teach one consistent introductory rule and then clearly qualify it when a multi-verb cluster, special construction or regional usage requires nuance. Do not lie to simplify.
3. Show meaning and communicative situation before the technical labels. Explain Dutch terms in approachable English, e.g. **persoonsvorm = conjugated/finite verb**, **hoofdzin = main clause**, **bijzin = subordinate clause**, **inversie = finite verb before the subject after a fronted element**.
4. **Count constituents, not words.** A whole fronted subordinate clause takes position one in a main clause.
5. Mark actual spans from the sentence. Never invent a one-size-fits-all parser or generic chips assigning wrong roles. A no-breakdown state is more honest than a false analysis.
6. Tell the learner explicitly what English makes tempting but invalid: "I have to work" does **not** become "Ik heb werken"; "when I am ready, I call" cannot become "Als ik klaar ben, ik bel".
7. When showing a common mistake, state what is wrong and *why* that change fixes it; an alternative correct phrasing is NOT a mistake.
8. Be careful with **als** (if/when/whenever), **wanneer** (when/conditional; often more formal), **toen** (specific past period/event vs repeated past with als), **omdat** (subordinate reason), **want** (coordinating connector), **daarom** (result adverb + V2), **dat** as conjunction/demonstrative/relative.
9. For Belgian contexts, show the neutral safe standard Dutch first. Real Flemish usage can be mentioned with a precise regional note, not mislabelled "wrong".
10. No claim of naturalness, native review, pronunciation assessment or grammatical acceptability beyond the evidence. AI-reviewed and native-verified are different statuses.
11. Passive "ten similar examples" are helpful **reading material**, not interactive variations. A variation must have its own stable child ID, contextual prompt, model, explanation and tracked level/progress.
12. Never force a wrong translation to fill quotas. When there is not enough reviewed content, report an honest count shortfall.

## The learner-facing teaching contract

**A topic-wide lesson** teaches when/why the construction is used, several patterns and contrasts, model sentences with speech playback, common errors, and a short self-check.

**Each *individual* parent card** teaches: (a) natural situation and communicative goal; (b) accepted Dutch model and faithful English; (c) phrase meanings; (d) exact clause segmentation; (e) finite verbs, subjects and constituents; (f) **why** the order is correct and how English differs; (g) tense/modals/particles/negation as applicable; (h) one credible *specific* mistake with why; (i) truly equivalent optional alternatives vs meaning changes; (j) two or more related natural examples plus listening; (k) versioned status, source/review provenance. All content must fit mobile and work without reopening a long topic essay for each card.

**Speaking / Say It Yourself**: begin with Dutch situation, not a Dutch model sentence. Hide model until reveal. Offer optional English help, optional *pattern* hint in early guided practice, let the learner produce their own spoken answer and self-rate honestly. For advanced/mixed recall, do not name the conjunction or reveal target Dutch words.

**Word-order / Quiz**: explain the chosen model after submission and explain genuine word-order errors. If user input differs from known models, say "not one of the currently recognised models" rather than judging all Dutch automatically. Never accept altered tense, persons or meaning only because the token order is plausible.

## Gold-standard worked example A — ALS, fronted subordinate clause + inversion

**Situation (Dutch-first, no target sentence leaked):**
"Je manager wacht op een verslag. Het verslag is nog niet klaar. Je wilt uitleggen wanneer je het verstuurt. Wat zeg je?"

**English help (hidden unless requested):**
"Your manager is waiting for a report. You will send it after it is ready. Explain your plan."

**Goal:** Explain what you will do once a condition/time milestone is met.

**Model (revealed only after response):**
"Als het verslag klaar is, stuur ik het naar mijn manager."

**Natural English:** "When the report is ready, I'll send it to my manager." ("If" is also possible in a genuinely conditional context; context decides.)

**Small meanings:** als = if/when; het verslag = the report; klaar = ready; is = is; stuur = send; ik = I; het = it; naar mijn manager = to my manager.

**Exactly segmented:**
- **Subordinate clause — bijzin:** [Als | het verslag | klaar | is]
  - Als: subordinating conjunction; het verslag: subject; klaar: predicate adjective; is: finite verb of "zijn".
  - WHY: in this simple subordinate clause, the finite verb typically follows the other clause elements. Compare independent "Het verslag is klaar" with "als het verslag klaar is".
- **Main clause — hoofdzin:** [stuur | ik | het | naar mijn manager]
  - stuur: finite verb; ik: subject; het: direct object; naar mijn manager: destination/recipient.
  - WHY: the WHOLE fronted als-clause is the first constituent of the main sentence. Dutch V2 puts the finite main verb directly after that first constituent, thus **stuur ik**, not **ik stuur**.
- **Do not make the false claim "every verb is always the very last word".** Multiple verbs form a final cluster with real variation; teach that separately.

**Credible learner error 1:** "Als het verslag is klaar, stuur ik het naar mijn manager."
**Correction:** "... als het verslag klaar is, ..." 
**WHY:** the simple subordinate clause has predicate klaar before finite is; the learner copied main-clause "Het verslag is klaar".

**Credible learner error 2:** "Als het verslag klaar is, ik stuur het naar mijn manager."
**Correction:** "... stuur ik het ..."
**WHY:** the fronted dependent clause takes position one, forcing the finite main verb before ik.

**Same-meaning alternative (clause order):**
"Ik stuur het naar mijn manager als het verslag klaar is."
**WHY:** the main clause comes first, so ordinary **ik stuur**; the subordinate still contains **klaar is**. This is a legitimate accepted model if the scenario requires neither a fronted subordinate nor a specific emphasis.

**Good passive related examples:** 
- "Als de vergadering afgelopen is, stuur ik de notulen." — When the meeting is over, I'll send the minutes.
- "Ik bel je als ik thuis ben." — I'll call you when I'm home.
- "Als de test mislukt, draaien we de wijziging terug." — If the test fails, we roll back the change.

**Mini reflex variation — Dutch-first, UNCUED:**
"Je team wacht op de uitslag van een test. Bij een fout herstel je de vorige versie. Leg uit wat je doet."
Target could be: "Als de test mislukt, zet ik de vorige versie terug." Explain **mislukt** (subordinate-final) and **zet ik** (inversion) *after reveal*.

**Teaching success:** Learner can explain both verb positions *and* spontaneously reuse the pattern in a fresh situation, including a main-first equivalent.

## Worked example B — ALS after the main clause (no forced inversion)

**Model:** "Ik bel je als ik thuis ben."
**English:** "I'll call you when I'm home."
**Communication:** Promise a call at the time you arrive home.
**Structure:** Main [Ik (subject) | bel (finite verb) | je (object)] + subordinate [als | ik (subject) | thuis | ben (finite verb)].
**WHY:** In the main clause, **Ik bel** is normal subject-first V2. In the subordinate clause **als ik thuis ben**, **ben** moves after thuis. There is no reason to invert "bel ik" here because the main clause already begins with Ik.
**Contrast:** "Als ik thuis ben, bel ik je." Same basic plan, fronted subordinate and main-clause inversion.
**Mistake:** "Ik bel je als ik ben thuis." It copies "Ik ben thuis" into a subordinate context.
**Practice transfer:** "Ik stuur een bericht als de bus vertrekt." Explain **vertrekt** as the simple subordinate finite verb; the context determines whether future/conditional interpretation is appropriate.

## Worked example C — OMDAT versus WANT versus DAAROM

**Situation (Dutch-first):** "Je kunt niet verder werken. De server reageert niet. Leg aan een collega uit waarom je de logs bekijkt."

**Target:** "Omdat de server niet reageert, controleer ik de logs."
**English:** "Because the server isn't responding, I'm checking the logs."
**Purpose:** State the reason for an action (presented as the actual reason, not merely a hypothetical condition).
**Clause map:** [Omdat | de server | niet | reageert] + [controleer | ik | de logs].
**WHY in subordinate:** omdat introduces a reason clause; **reageert** is finite and closes this simple subordinate clause.
**WHY in main:** the entire fronted subordinate fills position one, so **controleer ik** (V2 inversion).
**English trap:** "Omdat de server niet reageert, ik controleer..." is invalid ordinary Dutch inversion.
**Two contrasting natural formulations:**
- "Ik controleer de logs, want de server reageert niet." Here **want** coordinates two main clauses: subject + finite **de server reageert**.
- "De server reageert niet. Daarom controleer ik de logs." **Daarom** announces a consequence and occupies position one; **controleer ik** follows.
**Do not:** Treat omdat / want / daarom as identical word-order switches, or teach "daarom" as a subordinating conjunction.
**New situation:** "Het formulier is onvolledig. Je vraagt extra gegevens." Learner should produce a reason/result without being explicitly told which connector to choose; after reveal explain why.

## Worked example D — HEBBEN / MOETEN / HOEVEN (the learner's actual confusion)

**Question the learner asked:** "Why moet and not heb? Ik heb niets doen."

**Concept:** English "have to" is a special English phrase for necessity. Dutch does NOT use ordinary "hebben + bare infinitive" for that meaning.
- "**Ik heb werk.**" = I have work. **Heb** expresses possession/situation; werk is a NOUN.
- "**Ik moet werken.**" = I have to work. **Moet** is a finite modal, **werken** a bare infinitive.
- "**Ik hoef morgen niet te werken.**" = I don't have to work tomorrow. **Hoef ... niet te + infinitive** clearly expresses absence of obligation.
- "**Ik heb het werk gedaan.**" = I have done the work. **Heb** is an auxiliary; **gedaan** is a past participle, not the infinitive doen.

**Detailed rule in learner language:** 
If the meaning is "I have something", use hebben with a noun. If "I must / have to do it", use moeten + infinitive. If "I do not need to do it", use niet hoeven te + infinitive. If "I have already done it", a perfect-tense construction can use hebben + past participle. Don't translate the English word "have" mechanically.

**Typical wrong model:** "Ik heb niets doen."
**Correct for no further obligation:** "Ik hoef niets meer te doen."
**WHY:** you mean there is no action you still need to perform; **hoeven** expresses that with **te doen**, and **meer** gives "anymore".
**Contrast:** "Ik heb niets gedaan" means "I haven't done anything"; that is about past completion, NOT absence of future obligation.
**Belgian nuance:** In Belgian Dutch, "Ik moet morgen niet werken" is often used for "I don't have to work tomorrow"; **Ik hoef morgen niet te werken** is a particularly clear unambiguous teaching model. Do not assert every use of *moet niet* means prohibition; context and region matter.

**Progressive practice:**
1. "Je hebt morgen veel taken. Wat zeg je?" → "Ik heb morgen veel werk."
2. "Je baas verwacht dat je morgen werkt. Wat zeg je?" → "Ik moet morgen werken."
3. "Je rooster is vrij. Je mag thuisblijven. Wat zeg je?" → "Ik hoef morgen niet te werken."
4. "Het werk is al klaar. Wat zeg je?" → "Ik heb het werk gedaan."
5. Mixed, no verb cue: "Je collega's vragen of je nog iets moet afronden. Alles is klaar." → "Ik hoef niets meer te doen."

## Worked example E — Separable verbs, six construction contrasts

**Core meaning:** **opsturen** = to send something off; particle **op** changes place depending on construction.

| Construction | Dutch | Explanation |
| --- | --- | --- |
| Present main | Ik stuur het verslag op. | Finite stuur is V2; particle op separates and appears later. |
| Simple past | Ik stuurde het verslag op. | Finite stuurde in past tense; particle still separate. |
| Perfect | Ik heb het verslag opgestuurd. | Auxiliary heb and participle opgestuurd (particle+ge+stem). |
| Modal | Ik moet het verslag opsturen. | Whole infinitive opsturen after modal moeten. |
| Simple subordinate | Ik weet dat hij het verslag opstuurt. | Joined finite opstuurt in subordinate clause. |
| te-infinitive | Ik probeer het verslag op te sturen. | te sits between separable particle op and base infinitive sturen. |
| Imperative | Stuur het verslag op! | Instruction: finite imperative and separated particle. |

**Teach why each changes**, not a table without a mechanism. Show infinitive vs finite vs participle; don't use "opgestuurd" when a bare infinitive is needed. Some complex verb clusters permit more than one order; avoid blanket rules.

**Common errors:**
- "Ik moet het verslag stuur op." → "Ik moet het verslag opsturen." A modal takes an infinitive, not another finite verb.
- "Ik heb het verslag gestuurd op." → "Ik heb het verslag opgestuurd." Standard participle keeps the separable verb joined.
- "Ik probeer het verslag te opsturen." → "Ik probeer het verslag op te sturen." In this construction te comes between op and sturen.
- "Ik weet dat hij het verslag stuurt op." → "Ik weet dat hij het verslag opstuurt." In a simple subordinate clause, join the finite separable verb.

**What to review:** Verbs with fixed prepositions, genuinely inseparable verbs such as verkopen/ontdekken/bezoeken, auxiliaries, irregular forms and regional variants. DO NOT algorithmically assume every prefix verb is separable.

**Fresh uncued situation (IT context):** "Je collega heeft nog geen rapport ontvangen. Je hebt het net verstuurd. Wat zeg je?" Model: "Ik heb het rapport net opgestuurd." Explain the perfect vs present and why the particle is attached.

## Worked example F — TOEN versus ALS versus WANNEER (time interpretation)

- **One specific event in the past:** "Toen ik gisteren thuiskwam, was iedereen al aan het eten." = When I got home yesterday, everyone was already eating.
  - **Toen** refers to this one past occasion; [Toen | ik | gisteren | thuiskwam] is the subordinate clause, followed by inverted [was | iedereen | al aan het eten].
- **A repeated past habit:** "Als ik vroeger thuiskwam, dronk ik thee." = Whenever I used to come home, I drank tea.
  - "Vroeger" and habit context matter; **als** here means whenever, NOT a single one-time past event.
- **Time/condition in present/future:** "Wanneer ik thuis ben, bel ik je." / "Als ik thuis ben, bel ik je."
  - Both can work, but **wanneer** is generally more formal/written in many contexts; exact condition-vs-time interpretation depends on the scenario.

**Pitfall:** Never teach "als = future, toen = past" as a universal rule. Repeated past contexts commonly use als; when/if overlaps with wanneer in the present/future.

**Mixed scenario WITHOUT connector hint:** "Vroeger nam je telkens de bus wanneer het regende. Beschrijf je gewoonte." Better advanced prompt: "Vertel hoe je vroeger naar school ging op regenachtige dagen." Model: "Als het regende, nam ik de bus." Analyze the habitual-past **als**, the past verbs regende/nam and main inversion.

## Worked example G — DAT as report versus demonstrative / relative

**Reported claim:** "Ik denk dat de printer kapot is." — I think the printer is broken.
**Structure:** Main [Ik | denk] + subordinate [dat | de printer | kapot | is].
**WHY:** dat introduces the thought/content of denken; finite is follows predicate kapot in this simple subordinate clause.
**Wrong:** "Ik denk dat de printer is kapot." This imports main-clause predicate order.
**Different DAT #1:** "Dat document ligt op de printer." = That document is lying on the printer. Here dat is a demonstrative determiner for a het-word, not a subordinating conjunction.
**Different DAT #2:** "Het document dat ik lees, is interessant." = The document that I'm reading is interesting. The relative clause "dat ik lees" describes document.
**Teaching goal:** From context, learner chooses whether to report an opinion, point to an item, or identify which item.

## Models of good and bad explanation

**REJECT as generic:**
- "The verb goes to the end because it is a subordinate clause."
- "Dutch uses inversion."
- "Op is a separable prefix."
- "This is correct grammar."
- "Als means if, full stop."
- "These two sentences are the same because they both contain words in Dutch."

**ACCEPT only if specific:**
- "In 'als het verslag klaar is', **is** belongs to the dependent clause and comes after predicate **klaar**; in the independent statement it would be 'Het verslag is klaar'. The entire dependent clause comes first, occupying position one of the main clause; its finite verb is therefore **stuur**, followed by subject **ik**. With the main clause first, it becomes 'Ik stuur het verslag ... als ...'."
- "In 'Ik hoef niets meer te doen', **hoef** means 'need to' in a negative context and requires **te doen** here; it does not mean possession. 'Ik heb niets gedaan' is grammatical but changes the meaning to a completed/past action."
- "In 'Ik probeer het verslag op te sturen', **te** splits the separable infinitive **opsturen** into **op te sturen**. A modal such as moeten instead takes attached bare infinitive **opsturen**."

## Test the *learning transfer*, not just the text

For every new topic/card family include checks that:
- The learner first sees a real scenario, not the correct Dutch answer.
- On reveal, labels match EXACT spans and actual finite verbs of that sentence; no invented tagging.
- The same topic can be expressed main-first and subordinate-first, with changed V2, when semantically appropriate.
- Wrong-order samples are **genuinely wrong**, not valid variants/regions; correct errors include **why**.
- All English is faithful; a scenario does not assert unmentioned facts or change person/time/negation.
- Alternatives accepted by a quiz are identical in underlying task meaning; when different, explain the difference rather than auto-accept.
- At least one fresh scenario tests uncued production in a new real-world context, not merely the memorized model.
- Variations have separate reviewed content and progress; passive example lists never affect mastery.
- Native review provenance is honest and clearly distinguished from AI editing.
- At end, a reviewer can answer "Could the learner construct a NEW sentence from this explanation?" If no, rewrite it.

## External grammar-check references (source verification, not blanket certification)

- [Taaladvies.net — Toen / als / wanneer + verleden tijd](https://taaladvies.net/toen-of-als-of-wanneer-en-verleden-tijd/) — one-time vs recurring past situations.
- [Taaladvies.net — Wanneer / als + present/future](https://taaladvies.net/wanneer-of-als-en-tegenwoordige-of-toekomende-tijd/) — semantic overlap and register.
- [Taaladvies.net — Separable verb groups and alternative word orders](https://taaladvies.net/in-moeten-kunnen-vullen-of-moeten-kunnen-invullen/) — cautions against universal verb-cluster claims.
- Consult [Taaladvies.net](https://taaladvies.net/) and [Team Taaladvies Vlaanderen](https://www.vlaanderen.be/team-taaladvies) for other difficult cases; record exact URL and claimed rule before accepting a content edit.
- Sources above support specific cited rules; they have NOT independently verified every authored example in this handover.

**Quality gate:** A card is acceptable only when its intended meaning, Dutch wording, grammatical analysis, common error and practice scenario form one coherent, accurate teaching unit. A filled JSON object and a green TypeScript build are not enough.
