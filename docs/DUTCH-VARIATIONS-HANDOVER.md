# Dutch gradual variation practice

Built against `EtiDavid/dutchtap` main at `eae186527dc0efb8ca1547a692ec2892cd635ec8`.
This change adds Dutch practice inside the existing saved-session system. The 600 original sentence IDs, main sentences, illustrations, recordings, vocabulary links, and French datasets remain intact.

## What the learner gets

- Study continues to use only the chosen main cards. Each card retains its original examples and now has ten additional related examples and a fuller construction guide.
- Speaking and Quiz share an optional variation family per main card. The switch is available on either the main card or a child.
- Enabling a family releases two examples first. A parent rated Mastered enables its family automatically. A new session created from the Mastered pool also starts with variations enabled.
- Manual disabling is respected: subsequent Mastered ratings do not override that choice. Re-enabling retains ratings, unlocked examples, and counters.
- Each child starts Difficult and keeps its own rating, separate from the main card. An Easy/Mastered speaking rating or three consecutive correct quiz answers qualifies that child to release one additional example. The maximum is ten per family.
- Speaking defaults to the last rating (Difficult when new). Revealing an answer scores nothing; Next saves the selected rating. A Mastered rating means a correct recall **before** revealing. Other ratings restart the speaking streak.
- Difficult cards appear more often; Mastered cards appear much less often. Random draws avoid immediately repeating the same sentence where another sentence is available, including duplicate models in different families.
- Quiz uses the existing taught-word-order game, with both meaning and a situation cue. Correct answers give ten points. Alternative valid Dutch word orders remain outside the taught-model scoring, as explained in the interface.
- A child has its own ten-success retirement counters. Main-card completion is independent; finishing both main modes archives the session and frees its active slot. Optional variations remain playable in that archived session.
- Previous card opens a read-only review dialog. It shows the model, translation, teaching notes, and audio; it never replays a rating or changes points. Each mode keeps its latest 100 reviewed cards.
- Variations have no illustration or paid recording. They use Dutch device speech, with an installed Dutch voice required. An English voice is never substituted. Main recordings retain their existing playback path.

## Content approach and review

There are **600 families with ten child IDs each**, or 6,000 family practice entries. These intentionally reuse an authored library of **34 grammatical constructions and 390 distinct Dutch/English sentence pairs**. They are not 6,000 bespoke sentences or newly extracted video quotations. Examples are related by construction; some share a grammar focus across different everyday contexts rather than the exact original vocabulary.

All 600 main explanation records receive a construction guide and related examples. Original part-by-part breakdowns remain in place. Editorial corrections address over-absolute final-verb claims, valid alternatives marked as mistakes, movement-verb auxiliary oversimplification, irregular *spreken/vertrekken*, possessives and demonstratives, and the specific questions David practised: *probeer/probeerde/geprobeerd*, *een nieuw gerecht*, *aan het* versus *bezig met*, *op de receptie*, object *het*, *ons/onze*, and *verkopen aan* versus infinitive *te*.

The main card's original examples are preserved as `originalExamples`; `notesFor` combines them with the ten new models and removes exact duplicates. This is an AI editorial review, not certification by a native Dutch teacher. Existing adapted-card notices remain visible.

Useful reference checks:

- https://www.vlaanderen.be/team-taaladvies/taaladviezen/aan-het-schoonmaken-schoon-aan-het-maken — both separable progressive placements are possible.
- https://www.vlaanderen.be/team-taaladvies/taaladviezen/proberen-vervoegen — proberen forms.
- https://taaladvies.net/proberen-of-geprobeerd/ — alternatives in perfect infinitive constructions.
- https://onzetaal.nl/taalloket/hartelijk-dank-hartelijke-dank — the fixed thanking formula and inflection after a possessive.

## Engineering details

`lib/variations/content.ts` resolves compact family references into child content. Shared example texts are stored once in `data/dutch-practice-bank.json`; `data/dutch-variations.json` stores the association with each parent. No runtime translation, arbitrary tense mutation, or paid API is used.

The session schema adds defaulted `variations`, `childProgress`, `history`, and an optional progress `level`. Old sessions with no new fields load with empty defaults. Validation rejects children outside the fixed parents, locked current children, and Dutch children inside French sessions. The same reducer runs locally and on the server; offline actions continue to use the existing idempotency and revision checks. Child ratings never produce global parent-level effects.

Quiz child levels reflect consecutive results: 0–2 Difficult, 3–4 Medium, 5–9 Easy, 10 Mastered. A wrong result resets the streak and level. Speaking uses the learner's explicit selected rating. Unlock counts never move backwards when a card becomes difficult again.

Do not reorder the ten published child assignments or silently change a child ID to a different sentence: saved child progress belongs to that ID. Add migrations for future removals or content reassignment.

To reproduce the authored datasets:

```bash
python3 scripts/author-dutch-practice.py
python3 scripts/dutch-teaching-corrections.py
```

Both scripts retain preserved original examples and are idempotent. Coverage is listed in `docs/DUTCH-VARIATION-COVERAGE.json`. The 34 bank labels are teaching groupings, not a complete linguistic parse of every possible reading.

## Validation

See `docs/DUTCH-VARIATIONS-VALIDATION.md` for final checks and the local installation package's README for application steps. No live account database, paid speech service, or production deployment was modified during this work.
