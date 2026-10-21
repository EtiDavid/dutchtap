# Dutch at Work editorial review

Review date: 21 October 2026. This is AI editorial review of literal authored material, not independent human or native-speaker certification. Structural tests cannot certify natural language. Speaking remains self-rated; there is no automatic pronunciation assessment or mastery certification.

The ten area batches contain 600 new parents. Each area has six smaller workplace situations, ten parents in each. A related library contains twelve authored child sentences per smaller situation. Rotating ten of those twelve creates a distinct family set for each parent: 6,000 stable child entries from 720 distinct sentences. Shared sentences retain their own appropriate prompt, English meaning and short explanation. They do not share learner progress across parent families. This intentional thematic reuse is not presented as 6,000 unique sentences.

Sources are literal annotated rows in `data/editorial/workplace/parents-*.jsonl` and `children-*.jsonl`. The assembler joins those written parts and explicit reviewed lexicon forms. It never translates, substitutes actors or generates model conjugations. Its deliberately incorrect agreement examples are assembled from supplied forms and are not published as correct answers. Ambiguous ze/zij and wie comparisons are labelled as comparisons rather than universally incorrect alternatives.

For each batch, editorial review considered the Dutch/English pair, actual communication act, actor, time, certainty, completion state, register, labelled parts, verb forms, fixed combinations, and family relationship. Initial accessible statements and requests lead to more involved coordination, dependencies and follow-up. All new learner ratings nevertheless start Difficult.

## Corrections made during review

- Split vocabulary senses that must not inherit an old definition: self-introduction versus proposing, demonstrating versus occurring, loading data versus cargo, closing windows versus concluding agreements, work shifts versus services, and figurative cause/location. Existing meanings and links remain unchanged.
- Checked homographs in vocabulary backlinks: finite werk does not point to the noun werk, and verb forms vragen/antwoorden do not point to question/answer nouns. Reviewed exclusions prevent those misleading links.
- Replaced a support sentence that differed from published recovery-time material only by “exacte”; its final version explains which data is needed before a reliable estimate.
- Rewrote a cumbersome repeated “nodig” support sentence into a direct statement of relevant data needs.
- Rejected draft alternative answers with changed actors, questions turned into statements, awkward focus, or mismatched card references. The final alternatives were read alongside their actual parents; all preserve the intended actor, action, time, certainty and communication act.
- Labelled existential er as introductory, with the actual following noun phrase as the subject. Subject questions identify their question phrase as the subject.
- Kept single past-event toen distinct from conditional/repeated als. Included both bezig met an activity and bezig plus a te-infinitive, alongside aan het.
- Distinguished incoming receipt, reading, understanding and approval; technical ability from permission; closing from deleting; a temporary workaround from removing its cause; restored service from completed cause analysis.
- Preserved je/jij for informal colleague situations and explicit u/uw address where appropriate. No universal claim about how all customer relationships should be addressed is made.
- Reviewed named verb paradigms and separable forms. Inloggen can report an action with hebben or a resulting signed-in state with zijn; signing in does not confer every permission.

The near-duplicate screen compares new parents against 2,886 distinct published sentences/models/examples and earlier new parents. The final screen found no candidates at lexical similarity ≥0.86 with length ratio ≥0.8. Exact normalised duplicates are separately rejected for every new parent, child and model. This heuristic does not establish semantic uniqueness; recurrence of useful communication functions across different workplace situations is intentional. See `near-duplicate-candidates.json` and the reproducible review script.

## Authorities actually consulted

These resolve particular usage questions, rather than certifying the entire deck:

- [Team Taaladvies: working from home](https://www.vlaanderen.be/team-taaladvies/taaladviezen/van-thuis-uit-werken-van-thuis-werken-van-huis-uit-werken-vanuit-huis-werken-thuiswerken): van thuis uit werken is standard Belgian wording; regional alternatives are explained where relevant.
- [ANS: time expressions](https://e-ans.ivdnt.org/data/archief/ans2/e-ans/04/06/05/01/body.html): voormiddag and namiddag in Belgian usage.
- [Team Taaladvies: u or je](https://www.vlaanderen.be/intern/werkplek/ondersteuning/heerlijk-helder/u-of-je): register depends on the relationship and context.
- [Taaladvies: bezig zijn / aan de gang zijn](https://taaladvies.net/bezig-zijn-of-aan-de-gang-zijn/) and [Team Taaladvies: bezighouden / bezig houden](https://www.vlaanderen.be/team-taaladvies/taaladviezen/bezighouden-bezighouden-bezig-houden-bezighoudt-bezig-houdt): activity constructions and their distinctions.
- [Team Taaladvies: aan het schoonmaken](https://www.vlaanderen.be/team-taaladvies/taaladviezen/aan-het-schoonmaken-schoon-aan-het-maken): ongoing constructions and separable placement.
- [Team Taaladvies: inloggen / aanloggen](https://www.vlaanderen.be/team-taaladvies/taaladviezen/inloggen-aanloggen): both forms are standard; inloggen is more usual, with action and resulting-state examples.

The frozen grammar curriculum and selected extracted passages from the available possessives and July diary PDFs were background. The available diary filename differed from the requested filename. No claim is made to have read unavailable attachments or every PDF passage. Their translations were not treated as an authoritative answer key. No curriculum content or personal PDF is included or modified.
