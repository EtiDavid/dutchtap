# Grammar patterns

The grammar section works like the flashcards. Each pattern from the old labs (Verb second, Omdat, Dat, Als, Tot, Toen, Verbs, Separable verbs,
Past & perfect) is a set of real sentences in its own collection, **Grammar patterns**, so a pattern session has everything a flashcard session has:

* **Study**: the sentence, its meaning, an explanation of why the word order or form is right, and ten similar examples with a Listen button.
* **Say it** (Speaking): an English situation tells you what to express; you say it, check the Dutch, then rate it Difficult / Medium / Easy / Mastered.
* **Word order** (Quiz): the same sentences as tiles, scored per answer.
* **Levels, streaks, five-session limit, sync and offline** all work as for any session. Levels belong to the sentence, as always.

Sessions are created from Practise → Grammar patterns, or from Create session → Collection → Grammar patterns → a pattern.
A pattern tile opens the form already pointed at that pattern (`/flashcards?new=grammar:als`).

## Content
196 sentences: the 110 original lab tasks plus 86 new ones (84 for the six structure patterns, 6 for tenses) written as AI-editorial work; no
native-speaker review. Source: `data/learning-tasks.json` + `data/editorial/grammar-pattern-extra.tsv`.
Rebuild with `python3 scripts/build-grammar-patterns.py` (writes `data/grammar-pattern-cards.json` and `data/grammar-pattern-notes.json`).
Ids look like `pat-als-07`. Cards are pictureless and spoken by the Dutch device voice. They are not French (the collection is Dutch-only).

## What they deliberately do not have
No sentence breakdown chips, no ten related "child" practice sentences and no alternative model answers: the explanation, the ten similar
examples in the note and the pattern itself take that role. `CORE_CARDS` (Everyday + Dutch at Work, 1,200 sentences) is the set that must have
breakdowns, families and answer models; `GRAMMAR_CARDS` is separate.

The older labs (`/learn`, "Think in Dutch" and the verb tables) remain for mixed practice and typing answers.
