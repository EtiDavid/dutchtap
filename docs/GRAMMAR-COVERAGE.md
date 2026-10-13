# Grammar coverage audit (Stage 1)

How well the **existing 300 sentences** cover the grammar David has practised, which patterns have no main card yet,
and what is proposed to close each gap. This audits the deck; it does not change it. No sentence, ID, picture or
recording was altered in Stage 1.

Flashcards complement the frozen **Nova Dutch Academy** curriculum (v1.0). Self-ratings in the app do **not** promote a
formal grammar module, and a topic being *planned* in the curriculum is not evidence that it was learned.

## What was audited, and what was not

| Source | Used for | Confidence | Notes |
| --- | --- | --- | --- |
| The handover's pattern table (`01-Cowork-Persistent-Flashcard-Sessions.md`) | The list of 34 patterns below | **Lesson recall** (reported by David, not independently re-checked) | Its examples are starting points, not an answer key. |
| `Nova_Dutch_Academy_Official_Grammar_Curriculum_v1.0_FINAL.md` (+ Grammar Handbook v1.0) | Module names M00 to M12 | **Planned**, not proven learned | Used only to name the closest module for each pattern. |
| `Dutch_Possessives_My_Your_His.pdf` (331 phrases) | Possessive coverage, sources of ideas | **Unverified source material** | Its translations visibly contain errors and column misalignments (for example "Mach reached limit", "your seed"); it is not used as an answer key. |
| `Mijn Maand - Dagboek Juli.pdf` (31 daily texts) | Source of several example sentences | **Source text with transcription errors** | Some English lines contain stray tokens such as "[sniffs]" and "[music]". Dutch from it was re-checked before use; wording taken from it is marked *adapted from the diary*. |
| The 300 cards, `data/grammar-notes.json`, `data/grammar-breakdowns.json`, vocabulary | What is actually covered | **Current deck** | Coverage below was found with the labelled sentence breakdowns, then checked by hand. |

**Not available / not audited:** other Dutch-learning conversations and lesson-history records are not in this repository or
environment, so nothing here claims exhaustive access to David's history. The Day 1/Day 2 review and drill PDFs in the
Downloads folder were seen but not read.

Legend. **Covered**: at least one main card practises the target structure. **Partly**: the idea appears but not in the exact
form listed. **Gap**: no main card. IDs are cards in the current deck.

## Pattern table

| # | Pattern (handover) | Closest curriculum module | Existing main cards | Status | Proposed grammar-equivalent addition (for Codex; unreviewed) |
| --- | --- | --- | --- | --- | --- |
| 1 | Basic SVO and agreement | M01.01, M01.03 | conversation-01, shopping-11, work-01, conversation-61 | Covered | none |
| 2 | V2 after a fronted time/place | M01.02, M01.04 | home-07, school-08 | Partly (time phrases only) | *Vandaag drink ik koffie.* · *Hier oefenen we Nederlandse zinnen.* (place first) |
| 3 | Topicalization of an object | M07.01 | none | **Gap** | *Een glas water heb ik gedronken.* |
| 4 | Yes/no and question-word inversion | M06.01, M06.02 | conversation-06, work-24, home-21 (the -t drops after je), shopping-01 | Covered; two recurring corrections still missing | *Woon je in Roeselare?* · *Waar woon je?* · *Wat doe je dan?* |
| 5 | Perfect-tense questions and *al* | M06.03 | home-03, food-05, shopping-18; *al* in home-04, school-05 | Partly (no question with *al*) | *Heb je al gegeten?* · *Heb je deze favorieten al ontdekt?* |
| 6 | Main-clause *dat* vs conjunction *dat* | M02.03, M07.02 | demonstrative *dat*: conversation-22, conversation-29, shopping-23 | Partly (no conjunction *dat*) | *Dat zie ik ook wel.* · *Ik weet dat hij komt.* |
| 7 | Existential *er* | M12.03 | weather-06, home-08, transport-19 | Covered; yearly-event and perfect forms missing | *In Roeselare is er elk jaar een grote kermis.* (adapted from the diary's Tilburg sentence) · *Er is een aardbeving geweest.* |
| 8 | Location-first and posture verbs | M11.01 | posture verbs: school-07, home-08, shopping-27 | Partly (no location-first sentence) | *Op tafel ligt een boek.* · *Op mijn bureau staat een kop koffie.* (the diary has *Op mijn bureau staat een kop koffie*) |
| 9 | Dummy *het* / dates / becoming | M01.01, M05.01 | weather-01, weather-09, conversation-15 | Partly (no date; no *wordt het*) | *Vandaag is het woensdag.* · *Morgen wordt het een drukke dag.* (do not put *is* and *wordt* together as two finite verbs) |
| 10 | *Since* and duration | M05.03, M11.03 | related only: conversation-14, transport-12 | **Gap** | *Ik woon sinds vorig jaar in Roeselare.* (note that other placements are possible) |
| 11 | Time/duration with the perfect | M05.03 | conversation-14 (*urenlang*), food-15 | Partly (no duration plus direction) | *Ik heb twee uur naar huis gefietst.* |
| 12 | Present vs perfect vs simple past | M05.01 to M05.03 | present: conversation-01 · perfect: food-03 · simple past: shopping-12, leisure-02 | Covered across cards; no single contrasting set | contrast set as supporting examples: *Ik werk. Ik heb gewerkt. Gisteren las ik een boek.* |
| 13 | Perfect auxiliaries (*hebben* vs *zijn*) | M05.03 | *hebben*: food-03, school-18 · *zijn*: transport-12, school-19, conversation-18, school-21, transport-37 | Covered; the diary's cycling pair is missing | *Na het werk ben ik naar huis gefietst.* · *Thuis heb ik een glas water gedronken.* (diary) |
| 14 | *aan het* + infinitive | M05.01 | home-02, conversation-32, leisure-19 | Covered | optional: *Mijn manager is aan het bellen.* |
| 15 | Modal + final infinitive | M03.03, M07.03 | 43 cards, e.g. shopping-01, home-05, conversation-54 | Covered | none |
| 16 | Future and polite conditional | M05.04 | *zal/zullen*: work-02, weather-03, conversation-45, home-35 | Partly (no *zou*) | *Zou het mogelijk zijn om Engels te spreken?* |
| 17 | *hoeven niet te* vs *moeten/mogen* | M03.03 | *moeten/mogen*: school-06, shopping-07, school-16 | Partly (no *hoeven*) | *Ik hoef niet te werken.* (diary, Day 2) |
| 18 | *omdat* vs *daarom* | M04.02 | *omdat*: school-09 | Partly (no *daarom*) | *Ik ben ziek, daarom blijf ik thuis.* |
| 19 | *dat, als, terwijl, toen/wanneer* | M04.06, M04.07 | *als*: conversation-20, conversation-69 · *totdat*: school-11 · *voordat*: home-33 · *zodra*: work-25 · *tot*: health-04 | Partly (no *dat*, *terwijl*, *toen*) | *Als ik tijd heb, oefen ik Nederlands.* · *Toen ik thuiskwam, was ik moe.* |
| 20 | Separable verbs | M03.04 | 29 cards, e.g. transport-09, home-09, home-27 | Covered; *bijwonen* / *meedoen* missing | *Ik woon de vergadering bij.* · *Ik doe mee.* |
| 21 | *deelnemen* and fixed prepositions | M11.04 | fixed verb + preposition: weather-02, work-05, conversation-41, conversation-70, work-23 and about 15 more | Partly (no *deelnemen aan*) | *Ik neem deel aan de vergadering.* (contrast *meedoen*, *bijwonen*) |
| 22 | Reflexives | M03.05, M08.04 | conversation-09, conversation-11, health-03, health-07, health-09 | Covered; *zich afvragen* / *herinneren* missing | *Ik vraag me af.* · *Zij vraagt zich af.* · *Ik herinner me zijn naam.* |
| 23 | *er* + preposition / idioms | M12.03 | *eraan*: conversation-46, weather-14 · *erop*: work-06 · *erover*: work-18, home-22, work-29 · *daarmee*: conversation-21 | Partly (no *ernaar*, no idiomatic *er ... uit*) | *Ik denk eraan.* · *Ik kijk ernaar.* · *Het ziet er vreemd uit.* · *Ik ga er vol voor.* (each explained separately) |
| 24 | Relative clauses | M12.02 | none | **Gap** | *Nummers die je leuk vindt.* |
| 25 | Articles and demonstratives | M02.01, M02.03 | 24 cards, e.g. shopping-04, school-03, home-06 | Covered; no diminutive example | *Dit meisje.* (diminutives are het-words) |
| 26 | Attributive vs predicate adjectives | M09.01, M09.02 | predicate: weather-01, home-18 · attributive: shopping-05, home-17, health-06, conversation-22 | Covered; *een groot bedrijf* is missing | *Ik werk bij een groot bedrijf.* · *Het kantoor is rustig.* |
| 27 | Possessives | M08.02 | 37 cards, covering *mijn, je, jouw, zijn, haar, hun, uw* | Partly (no *ons/onze* contrast) | *Dit is ons huis.* · *Dit is onze auto.* |
| 28 | *niet* vs *geen* | M10.01, M10.02 | *geen*: shopping-06, home-31, food-18 · *niet*: school-02, conversation-07, food-13 | Partly (no name as object) | *Marieke kent Martin niet.* · *Ze wil geen thee drinken.* |
| 29 | Prepositions and expressions | M11.01 to M11.03 | school-07 (*op tafel*), home-07 (*na het werk*) | Partly | *Ik werk op kantoor.* · *Op mijn werk is het druk.* |
| 30 | *hebben* + *genoeg* + noun + *voor* | M11.04 | none | **Gap** | *Ik heb genoeg tijd voor uitstapjes.* (diary, Day 1) |
| 31 | Recipient *aan* | M11.04 | none | **Gap** | *Ik geef Nederlandse les aan buitenlandse studenten.* |
| 32 | Imperatives vs ordinary V2 | M01.02 | imperatives: conversation-48, school-12, school-14, transport-18, conversation-53 | Partly (no contrast pair) | *En roer het dan.* vs *En dan roer je het.* |
| 33 | Pragmatic particles | M12.04 | *nog eens*: school-01 · *al eens*: conversation-27 | Partly (no *toch*, *wel*) | *Dat is toch leuk?* · *Dat zie ik ook wel.* |
| 34 | Comparative / superlative | M09.03, M09.04 | comparatives: shopping-08, conversation-02, home-17, conversation-66 | Partly (no superlative) | *zwaar, zwaarder, zwaarst*: *Dit is de zwaarste tas.* |

**Totals:** 11 covered (some with a small missing variant), 18 partly covered, 5 gaps (rows 3, 10, 24, 30 and 31).
Proposals are *grammar-equivalent*: they keep the target structure and change situation, subject or object.

## Recurring corrections

| Correction | Where it is practised now | Still missing |
| --- | --- | --- |
| *dit brood* (het-word takes *dit*) | school-03 *dit woord*, shopping-10, shopping-20 (mistake notes explain *dit/deze*) | a main card with *brood* |
| *Waar woon je?* (verb before subject, -t drops) | work-24 *Waar werk je?*, conversation-05 *Waar kom je vandaan?* | the exact sentence (row 4) |
| Subordinate verb-final placement | school-09, conversation-20, conversation-69, school-11, home-33, work-25, health-04 | *dat*, *terwijl*, *toen* (row 19) |
| *een groot bedrijf* (adjective ending after *een*) | shopping-05, home-17, health-06 | the exact sentence (row 26) |
| *er* + preposition | conversation-46, work-06, work-18, home-22, work-29 | *ernaar*, idiomatic *er ... uit* (row 23) |

## Duplicate audit (existing deck and vocabulary)

* **Sentences:** no duplicates, including punctuation-only and case-only variants. No card's variation equals another card's sentence.
* **Near-duplicates (15 pairs, shared word overlap of 60% or more):** every pair differs in situation and object while keeping the same
  structure (for example *Ik heb een dokter nodig.* / *Ik heb een kaart nodig.*; *Waar is het toilet?* / *Waar is het bed?*). This is
  intended repetition of a grammar pattern, so **no cards need to change**. None of them needs new pictures or audio.
* **Vocabulary:** 163 entries, no duplicate ids. The only repeated headword is *prijs* with two different senses (*price* and
  *award*), which are correctly separate entries. Common words (*ik, de, het*) are deliberately reused.
* **Existing duplicate needing a replacement proposal:** none.

## Source versus adapted

* 50 original cards (written for this app), 250 additions: **100** from the user-approved local replacement for video 1 and **150**
  from video 2 (`LZwfl7gBat8`), recorded in `data/flashcard-additions.json` (`source`) and `docs/expansion/sources.json`.
* The deck does not record a per-card *adapted* flag, so a source-versus-adapted split cannot be stated honestly from the data. Codex
  should record `adapted: true` plus a note for every sentence changed from its source.
* The proposals above that come from the diary or the handover are marked as such; none is attributed verbatim to a video.

## Cautions for new content

* Past lesson outputs can contain mistakes. Do **not** copy malformed multi-verb clusters such as *Hij zei dat hij moeten werken had*;
  verb-cluster sentences (curriculum M07.03) need a native-speaker check before they are added.
* Prefer checked, standard patterns, and say so when an alternative is also correct (for example *kan/kunt u*, *heb/hebt u*, *half zes*).
* Do not alter an existing main sentence without regenerating its picture and recording and checking every reference.
