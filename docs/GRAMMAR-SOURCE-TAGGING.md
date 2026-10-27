# Grammar source-card tagging (P5)

Existing Everyday and Dutch at Work sentences can practise grammar patterns even when no one wrote them for that pattern. This file records how they are tagged and what was rejected.

## Model: one sentence, one rating, many topics

- A **tag** (`data/grammar-source-tags.json`) points at the one original card. It adds no card, no second copy of the sentence and no second rating.
- An **alias** (`data/grammar-reuse-links.json`) is the older mechanism: a grammar-topic card that resolves its content from one original but has its own grammar rating, so Everyday mastery never implies pattern mastery. 184 aliases exist; a sentence aliased into two topics (e.g. `career-support-039`) is **never drawn twice into one session** (`eligibleIds`, `levelCounts` deduplicate by `originCardId`).
- The sentence page shows *Grammar in this sentence* with links to each topic's session, for the original and for its aliases.

## What was tagged

- `indirect`: 4 tags
- `of`: 10 tags
- `separable`: 105 tags
- `tot`: 4 tags

Total: 123 tags on 118 original sentences. Conjunction topics (`als`, `omdat`, `dat`, `toen`, `wanneer`, `terwijl`, `voordat`, `nadat`, `zodra`, `hoewel`) needed no new tags: every real hit in the 1,200 core sentences was already an explicit alias. Hits for `als` (as), `dat` (demonstrative) and `of` (or) were read one by one; `of = whether`, `of = or` and `toegang tot` were tagged, `als = as` and demonstrative `dat` were not.

## How it was done

1. `scripts/tag-grammar-sources.py` detects candidates (separable-verb forms from the 68-verb forms table, split or joined).
2. Every candidate sentence was read. 25 were rejected (below); 3 had their lemma narrowed.
3. A test (`tests/grammar.source-tags.test.ts`) re-checks that every separable tag shows the verb in the sentence and every `of` / `tot` tag shows the word.

## Rejected after reading

| Card | Why |
| --- | --- |
| `home-13` | nominal infinitive (voor het opruimen) |
| `work-147` | nominal infinitive (met het opruimen) |
| `work-269` | nominal infinitive (bij het aanvragen) |
| `career-changes-009` | noun aanvraag, not the verb |
| `career-changes-048` | adjective afgesproken (het afgesproken moment) |
| `career-changes-057` | nominal infinitive (voor het terugdraaien) |
| `career-clarification-020` | quoted word, not used as a verb |
| `career-clarification-027` | false match: no separable verb |
| `career-clarification-028` | false match: no separable verb |
| `career-clarification-030` | noun uitleg; opsplitsen is not in the forms table |
| `career-incidents-018` | different verb (afnemen) |
| `career-meetings-052` | op zich nemen, not a separable particle |
| `career-priorities-004` | noun aanvraag |
| `career-priorities-031` | adjective afgesproken |
| `career-priorities-046` | op zich nemen, not a separable particle |
| `career-priorities-048` | noun aanvragen |
| `career-priorities-060` | overdragen, not overnemen |
| `career-problems-010` | nominal infinitive (na het aanmelden) |
| `career-support-007` | false match: no separable verb |
| `career-support-020` | noun uitleg |
| `career-support-048` | false match: no separable verb |
| `career-support-055` | false match: no separable verb |
| `career-support-058` | quoted word (Afsluiten betekent...) |
| `career-troubleshooting-002` | false match: no separable verb |
| `career-troubleshooting-013` | false match: no separable verb |

## Limits

- Tags are AI-editorial-checked, not native-reviewed.
- Only separable verbs, `of`, `tot` and embedded questions were tagged this way. Relative clauses, inversion, tenses and verbs-in-context have no tags yet: they need a reviewed detector, not a regex.
- Tags are shown and used for display, counts and the no-duplicate guarantee. They do not yet add the sentence to a topic's session (that would need its own rating and analysis).
