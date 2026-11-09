# DutchNova_1 — Conversation Mastery Pack
Status: **planning + editorial seed; not implemented in the app yet**.
Created from the user's Dutch grammar/conversation exchanges in this project, 10 November 2026.
Target: a *new independent practice section* in DutchTap, preserving all existing IDs, decks, scores and session behavior. This pack is NOT a replacement for Grammar Patterns or a production release.

## Goal
Convert grammar the learner has already discussed into fast, reusable spoken Dutch. Train transfer across supermarket, home, friends, doctors, phone calls, office, infrastructure/DevOps, TV, shopping, football and job searches. **No filler quota** and no generic grammar notes recycled across cards.

## Why a separate pack?
- Existing app already has Study → Speaking (self-rated) → Quiz/word order, session persistence and Grammar Patterns. Reuse these components rather than building a duplicate game.
- Name/slug: display **DutchNova_1**, stable namespace **dutchnova_1**. Keep it independent from Dutch Core/French/Grammar card statistics.
- Practice order: read/understand (deep explanation) → English situation to spoken Dutch (user-initiated quiz; no forced timer) → word-order/typing → uncued mixed-speed retrieval, then optional Dutch-first situations.
- Audio phase only *after* language QA, using Dutch-BE voice where possible with play, slow playback and replay; avoid adding audio now.

## Conversation coverage matrix (initial audit; expand when reviewing full source)
1. Modals, necessity: moeten, hoeven + te, zouden, hadden moeten, zou + infinitive; conditional meaning.
2. Word order: declarative V2, question inversion, fronted time / subordinate clause, subordinate-final verbs, object placement, time-object order.
3. Separable verbs and infinitives: aanraken, bellen/opbellen, afspreken, opruimen, schoonmaken, voorbereiden, terugbellen, afmaken, bijhouden; aan te raken.
4. Perfect/past: hebben + geoefend/gezien/gekeken/geroken/geraakt; double infinitive *hadden moeten afspreken*; zijn + gaan slapen.
5. Aan het + infinitive and simple present: kijk je iets / ben je iets aan het kijken; standing/sitting + te + infinitive, blijven + infinitive.
6. Pronouns and reference: de/het → hij/het/die (with caveats for feminine nouns), reflexives zich/me/je/ons, zelf vs zich; deze/dit/die/dat.
7. Particle nuance: **nog**, **nog even**, **alleen nog**, **nog een**, **nog maar**, **nog niet**, **nog steeds**, **al**, **alweer**, **even**, **net**, **daarnet**, **straks**, **toch**.
8. Negation: niet vs geen, nog niet vs niet meer, contrasting already/not yet.
9. Preferences and food: graag, lusten, lekker vinden, houden van, liever/het liefst, smaak versus activity; adjective -e.
10. Quantifiers and differences: nog een vs een andere vs de andere vs nog een andere; *de aanbieding/in promotie/korting*; wisselgeld, krijgen vs geven, van mij.
11. Shopping/social: stukje vlees, diminutives, een lekker stukje, bestellen/bestelling, oplossing/oplossen, job/werk.
12. Time and temperature: hoe laat ga je slapen, zou je gaan slapen, ik heb het koud/warm, het is lekker warm, ik krijg het koud.
13. Prepositions/collocations: kijken naar/op tv; wachten op; zoeken naar/iemand zoeken; naar de winkel, uitdrukking *in de aanbieding*.
14. Conjunctions: als vs of vs terwijl; omdat, dat, wanneer indirect question; purpose **om ... te**.
15. Speech and professional use: English request on phone, stage/job interview, employer calls, doctor booking, office status updates, Dutch learning while practising IT.
16. Meaning contrasts: raken vs aanraken vs ruiken vs roken; worden vs zijn; tegemoet context, positional verbs; lijken/klinken.
17. Contrastive adjectives: *Spaanse series*, *een andere jas*, *een ander huis*, *een lekker stukje vlees*.
18. Conversational fragments: *Nu alleen nog ...*, *Wat romantisch!*, *Je komt toch?*, *Zo arm ben je toch niet?*, *Dan krijgt u ...*.

Editorial integrity: not every earlier tutor explanation is fully correct. Recheck before production. In particular:
- Do **not** teach that every *de*-word always takes **hij**; Dutch grammatical gender and regional conventions matter, and **die** often works for inanimate objects.
- Don't label “Kijk je iets op tv?” the only way to describe current viewing; nuance simple present versus progressive.
- **Heb je de gynaecoloog nog te bellen?** is not standard. Use *Moet je ... nog bellen?*; *Hoef je ... nog te bellen?* is possible but not always pragmatically identical.
- *Lust jij dat?* and *Lust je dat?* are correct; with inversion do not blindly remove -t from all verbs (e.g. *eet je* retains lexical final t); compare *jij lust → lust jij*, *jij vindt → vind jij*.

## Proposed coverage target
Start with **80–120 carefully authored parent cards** covering the audit; then expand through contextual transfer to **250–400 unique scenarios**, plus independently tracked variations only when each tests a real change of meaning, tense, word order or setting. This is a proposed target, **not a count of completed cards**. For each major rule, test in ≥3 contexts (e.g. home/market/work), and combine 2–4 earlier topics in higher-level cards rather than simply duplicating translations. Include short micro-dialogues and realistic spoken Belgian Dutch using **je**, not **ge**.

## Parent-card data contract
Each record must eventually support:
- stable ID dutchnova1-####; topic tags; setting; difficulty and prerequisite tags.
- situation (Dutch-first, not leaking model); English scenario/goal for the requested English→Dutch quiz.
- one natural target Dutch response; faithful English meaning; no artificial textbook language.
- exact sentence-specific explanation: communication goal; clause map; finite verbs/subjects; why word placement; particle interpretation; meaning-changing contrasts.
- credible mistake + **why**, genuinely equivalent accepted responses separately from **non-equivalent contrasts**.
- 2–3 additional examples; notes on Belgian usage; editorial provenance (AI-drafted, independently reviewed status).
- optional 1–10 fully authored child variations, each with its own prompt, accepted models, explanation and progress.
- later: Dutch-BE audio asset, content hash/review status, audio quality check.

## Scoring and review
- Preserve current session set between Study/Speaking/Quiz; allow 5/10/20/custom and settings/scenario filters.
- Spoken answers are *self-rated* unless a validated ASR evaluator is separately delivered. Never mark speech pronunciation correct automatically.
- For typed/free answers, compare explicit normalized validated equivalents; unmatched is “not a recognised model”, NOT “incorrect Dutch”.
- Weakness-based review with per-card difficult/medium/easy/mastered, spaced practice and child-specific state.
- Mix topics once individual ones are familiar, including unseen combinations to prevent memorisation.
- Show English situation first *in the requested English→Dutch quiz*, but keep a Dutch-first speaking mode to build automaticity.
- No countdown timer by default; no penalty for alternative natural phrasing.

## Editorial seed: 20 concrete parent cards
Each is a starting *content draft* to review and map into the existing canonical data pipeline; **not yet loaded by the app**.

| ID | Setting & English situation | Target Dutch | Teaching contrast |
| --- | --- | --- | --- |
| 0001 | Supermarket: you still need to quickly get groceries before cooking. | We moeten nog even naar de supermarkt. | nog = unfinished; even = quick/low-burden |
| 0002 | Supermarket: you only have to get meat now. | Nu alleen nog een lekker stukje vlees. | elliptical speech; alleen nog; het stukje → lekker |
| 0003 | Shop assistant offers another coat as an extra option. | Hier is nog een jas. | nog een = extra |
| 0004 | Shop assistant offers a different coat after the first did not fit. | Hier is een andere jas. | een andere ≠ nog een |
| 0005 | Cashier returns change politely. | Dan krijgt u van mij uw wisselgeld. | V2 after dan; krijgen; formal u |
| 0006 | A friend wants to know if you like mushrooms. | Lust je champignons? | lusten about food; questions |
| 0007 | Explain that you enjoy eating chicken. | Ik eet graag kip. | graag before general indefinite object |
| 0008 | Ask a friend whether they have eaten anything tonight yet. | Heb je vanavond al iets gegeten? | time, al, iets, participle final |
| 0009 | Ask what a friend is doing now. | Wat ben je nu aan het doen? | aan het progressive |
| 0010 | Ask whether a friend is watching anything on TV right now. | Ben je iets op tv aan het kijken? | iets; ongoing; on TV |
| 0011 | Tell a friend you have watched two Spanish Netflix shows. | Ik heb Money Heist en Elite gezien. Ze staan allebei op Netflix. | gezien, allebei; Spanish adjective on variation |
| 0012 | Ask if they practiced for the test. | Heb je al geoefend voor de test? | geoefend; al; voor |
| 0013 | You regret not meeting a friend earlier. | We hadden eens moeten afspreken. | past regret, double infinitive |
| 0014 | You suggest meeting a friend soon. | We zouden binnenkort eens moeten afspreken. | future suggestion ≠ past regret |
| 0015 | Ask someone when they plan to go to bed. | Hoe laat ga je slapen? | gaan slapen vs slapen |
| 0016 | You feel cold in a room. | Ik heb het koud. | feeling vs environment |
| 0017 | You say it's pleasantly warm outside. | Het is lekker warm buiten. | impersonal het vs cold person |
| 0018 | You assume your friend is not really angry. | Je bent toch niet boos? | toch = expected reassurance |
| 0019 | You are tired but go to work anyway. | Ik ben moe, maar ik ga toch werken. | toch = despite |
| 0020 | At work, say you keep developing your IT skills while learning Dutch. | Terwijl ik Nederlands leer, blijf ik mijn IT-skills ontwikkelen. | terwijl subordinate verb last, main V2 |

## Compound scenario progression (examples)
1. **Market + nog + inversion + adjective:** “You're almost finished shopping. Tell your friend you only need another coat and a nice piece of meat.” Model: *Ik heb alleen nog een andere jas en een lekker stukje vlees nodig.* (Meaning check: here a *different* coat, not necessarily one more.)
2. **Office + omdat + nog + separable:** “You still need to call a colleague because the server isn't responding.” Model: *Ik moet mijn collega nog even bellen, omdat de server niet reageert.*
3. **Friends + regret + purpose:** “You regret not meeting up to watch football.” Model: *We hadden moeten afspreken om samen voetbal te kijken.*
4. **Doctor + question + nog:** “Ask if they still have to call the gynaecologist today.” Model: *Moet je vandaag de gynaecoloog nog bellen?*
5. **Home + toch + reflexive:** “You expect a friend to feel better now.” Model: *Je voelt je toch al beter?*
6. **Work + als + inversion + future:** “When the backup is ready, you'll call your manager.” Model: *Als de back-up klaar is, bel ik mijn manager.*
7. **Shop + nog even + al:** “Ask if you can quickly check the price because you haven't paid yet.” Model: *Mag ik nog even de prijs controleren? Ik heb nog niet betaald.*
8. **Friends + nog steeds + question:** “You're surprised they are still watching football.” Model: *Ben je nog steeds voetbal aan het kijken?*

## Proposed implementation sequence
1. Audit the complete conversation and the live repo canonical data/schema; mark observed topics vs expansions.
2. Prepare validated 80–120 base cards with IDs, scenarios, accepted answers and tailored teaching explanations. Include per-topic coverage tests, duplicates check, contrast test.
3. Integrate **DutchNova_1** in existing app navigation/session/deck plumbing, without changing existing core content or scores. Study + Speaking + Quiz share session selection.
4. Add mixed-topic/context transfer, children with independent state, and English→Dutch scenario setting.
5. Run unit/content check, regression tests and build; user review of difficult cards, then PR; don't merge or release before gates.
6. After written content is stable and reviewed, batch TTS + audio manifest + voice/audio QA (Dutch-BE; test Belgian pronunciation).

**Acceptance:** user can choose DutchNova_1, filter themes/settings, study a sentence with real why-first analysis, respond to English scenarios without seeing Dutch, reveal and self-rate, complete word-order/typed quiz, return to the same session, revisit weak cards, and retain existing progress. No new audio until after content sign-off.
