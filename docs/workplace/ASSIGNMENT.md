# DutchTap: 600 New Career-Focused Dutch Flashcards

## 1. Your assignment

Implement a complete **Dutch at Work** expansion for DutchTap.

Repository: https://github.com/EtiDavid/dutchtap

Add **600 new main sentence cards** alongside the existing collection. These are 600 complete sentences and useful workplace expressions, not 600 isolated vocabulary words.

The learner is David, an English-speaking beginner learning Dutch in Belgium. His career focus is:

* IT support and service desk work.
* Systems administration and systems engineering.
* Cloud infrastructure and DevOps.

The primary goal is practical communication with colleagues, users, customers, and managers. Technical language should support everyday workplace communication.

David should be able to explain a problem, ask useful questions, follow instructions, participate in a meeting, report progress, and hand work over.

Complete both the content and the implementation. Work in manageable batches internally, save progress, and continue until the full assignment is finished. Do not stop after producing a plan or a small demonstration.

## 2. Inspect the actual project first

Before editing:

1. Read `AGENTS.md` and relevant project documentation.
2. Inspect the current working tree and preserve existing uncommitted work.
3. Use a separate branch or worktree where appropriate.
4. Read the relevant documentation bundled with the installed Next.js version before changing application code.
5. Understand the current card, grammar, vocabulary, variation, session, quiz, audio, and persistence systems.
6. Run appropriate baseline checks and record existing failures separately.

The repository was last inspected at:

`1f353b78e6db247011ed383d4544c1d6a5c84761`

That is historical context, not an instruction to reset the repository. Inspect the current version and build on it.

At that inspection, there were 600 main Dutch cards, including 330 categorised as Work. Therefore, generic business expressions may already exist.

Check existing main cards, child examples, and alternative answers before writing the expansion.

If the following learning materials are supplied, read them:

* `Nova_Dutch_Academy_Official_Grammar_Curriculum_v1.0_FINAL.md`
* `Dutch_Possessives_My_Your_His.pdf`
* `Mijn Maand - Dagboek Juli(1).pdf`

Do not assume files or conversation history from another chat are available locally. Do not claim to have read unavailable material. This brief contains enough requirements to begin.

## 3. Organise the 600 sentences

Create ten workplace areas with 60 main cards each.

| Area                                     |   Count | Situations to cover                                                                                                |
| ---------------------------------------- | ------: | ------------------------------------------------------------------------------------------------------------------ |
| Office conversation and introductions    |      60 | Joining a team, explaining your role, finding your way around, availability, breaks, working from home             |
| Help, clarification, and repetition      |      60 | Asking someone to repeat, checking understanding, asking for a demonstration, explaining that you need more detail |
| User support and support requests        |      60 | Receiving a request, asking questions, arranging assistance, confirming what the user needs, following up          |
| Problems and their impact                |      60 | Describing symptoms, who is affected, when a problem began, intermittent problems, what still works                |
| Troubleshooting and explaining steps     |      60 | Checking settings, reproducing problems, asking users to try something, explaining observations and next steps     |
| Meetings and progress updates            |      60 | Stand-ups, reporting completed work, blockers, asking questions, taking notes, agreeing on actions                 |
| Tasks, priorities, and deadlines         |      60 | Choosing priorities, estimating time, asking for help, explaining delays, negotiating workload                     |
| Changes, testing, access, and permission |      60 | Requesting access, asking permission, describing tests, arranging changes, explaining approvals                    |
| Incidents, escalation, and handovers     |      60 | Reporting disruption, escalating, distinguishing a workaround from a fix, handing over unfinished work             |
| Email, chat, and remote collaboration    |      60 | Clear written updates, arranging calls, sharing documentation, confirming receipt, asking for a response           |
| **Total**                                | **600** |                                                                                                                    |

For each area, plan several smaller situations before authoring the sentences. Avoid creating 60 slight variations of the same request.

Include a sensible progression from short, accessible phrases to longer functional sentences. Language complexity must remain separate from the learner’s personal difficulty rating: a new card still starts Difficult for a new learner.

## 4. Language and vocabulary standard

Use natural standard Dutch suitable for Belgium. Include common Belgian wording where useful and explain regional alternatives when relevant.

Prefer sentences people could realistically say at work.

Examples of the intended direction:

* “Bedoel je dat het probleem bij elke aanmelding optreedt?”
* “Kun je voordoen welke stappen je normaal volgt?”
* “Ik krijg een foutmelding als ik de toepassing open.”
* “Welke van deze twee meldingen moet ik als eerste oppakken?”
* “Voor deze taak wacht ik nog op toegang tot de testomgeving.”
* “De tijdelijke oplossing werkt, maar de oorzaak is nog niet bekend.”

Recheck these examples against the current content before using them.

Use workplace vocabulary such as:

* de melding
* de foutmelding
* de storing
* het ticket
* de gebruiker
* de toepassing
* het account
* de toegang
* de rechten
* de wijziging
* de testomgeving
* de oorzaak
* de oplossing
* de overdracht

Common workplace loanwords such as server, backup, deployment, and pipeline may appear when they fit the situation. Explain unfamiliar terms in plain English.

Avoid filling the collection with abstract corporate language about strategy, innovation, competitiveness, and similar topics merely to reach 600.

Include both:

* **je/jij** when addressing a colleague informally.
* **u/uw** when a situation calls for polite address.

Do not imply that every workplace or customer relationship follows the same convention. State the intended register in the card’s context.

## 5. Required content for every main card

Every main card must contain, or resolve through the existing data system to:

1. A unique, stable ID.
2. The Dutch at Work collection and a workplace area.
3. A realistic English situation prompt.
4. The primary Dutch answer.
5. An accurate, natural English translation.
6. A detailed grammar explanation.
7. Relevant vocabulary linked to the vocabulary section.
8. Ten related practice examples.
9. Natural alternative answers where appropriate.
10. An explanation and English meaning for each alternative.
11. Dutch device speech support.
12. Appropriate content metadata using the project’s existing conventions.

Use existing schemas and authoring patterns where practical. Do not introduce a parallel flashcard engine.

Choose a new ID namespace after checking the existing validation rules. Do not reuse existing `work-*` IDs or change their meaning.

## 6. Write genuine situation prompts

Speaking and Quiz must ask the learner to communicate in a situation.

A weak prompt is:

“Translate: I get an error message when I open the application.”

A suitable prompt is:

“A colleague asks what happens when you open the application. Explain that an error message appears at that point.”

A good situation specifies the relevant details:

* Who is speaking?
* Who are they speaking to?
* What has happened?
* Is this happening now, repeatedly, or in the past?
* What does the speaker need to communicate?
* Is the speaker asking, instructing, offering, explaining, or reporting?

Make the situation specific enough to support the published answers, while allowing natural expression.

Do not accidentally add information absent from the answer or change:

* The person performing an action.
* The time of the event.
* Whether something is a question or a command.
* Whether the speaker is certain.
* Whether an action is completed, planned, or merely being considered.

Preserve important distinctions:

* A new account is not necessarily an unfamiliar account.
* A workaround is not necessarily a permanent fix.
* Closing a ticket is not necessarily deleting it.
* Receiving a message is not necessarily understanding it.
* Being able to do something is not always the same as having permission.
* “I must” and “I would like to” are different meanings.

## 7. Detailed explanations: the teaching standard

Explanations should teach the learner how to construct another useful sentence.

Do not stop at statements such as “This uses a subordinate clause” or “The verb goes at the end.”

For the actual sentence, explain the following where relevant.

### Meaning

Give a natural English meaning and explain expressions that cannot be understood word for word.

### Sentence parts

Identify the subject, finite verb, object, time phrase, prepositional phrase, and subordinate clause as applicable.

Use the actual words in the sentence. Do not assign labels mechanically when they do not fit.

### Word order

Explain why the words appear in that order.

For example:

* What occupies the first position?
* Which verb is finite?
* Why does the subject follow the verb?
* Which words belong to a subordinate clause?
* Where do an infinitive, participle, or separable particle belong?

Explain second position as the second constituent, not necessarily the second individual word.

### Verb forms

Give useful forms for the verb being taught:

* Infinitive.
* Relevant present form.
* Simple past.
* Perfect construction and participle.

Explain irregular forms and separable verbs correctly. Do not generate past forms by applying a universal suffix rule.

### Articles, possessives, and adjectives

Explain the article or ending when it matters.

Examples include:

* een nieuw account / het nieuwe account
* een nieuwe melding / de nieuwe melding
* ons systeem / onze server / onze systemen

Do not introduce article explanations unrelated to the sentence merely to fill space.

### Prepositions and fixed expressions

Explain phrases as units:

* toegang tot
* wachten op
* last hebben van
* contact opnemen met
* iemand op de hoogte houden
* verantwoordelijk zijn voor

Avoid presenting English prepositions as a reliable translation rule.

### Common mistakes

Give a small number of realistic mistakes, explain the problem, and show the correction.

Preserve nuance. Do not label another valid Dutch construction wrong simply because it differs from the main model.

### Related examples

Use examples to demonstrate how the structure changes with another workplace situation, subject, tense, question, or negation.

Keep the explanations readable. Detailed should mean useful and specific, not unnecessarily long.

## 8. Complete sample card: use this as a benchmark

### Situation

A colleague asks what happens when you open the application. Explain that an error message appears at that point.

### Main answer

**Ik krijg een foutmelding als ik de toepassing open.**

**English:** I get an error message when I open the application.

### Explanation

**Ik** is the subject: the person experiencing the problem.

**Krijg** is the present-tense form of **krijgen** with **ik**. In the main clause, the subject comes first and the finite verb comes second:

**Ik krijg een foutmelding.**

**Een foutmelding** is the direct object. It describes what the speaker gets or sees.

**Als ik de toepassing open** explains the situation in which the message appears.

Here, **als** naturally means **when**, because the speaker is describing what happens on opening the application.

Inside that subordinate clause:

* **ik** is the subject.
* **de toepassing** is the object.
* **open** is the finite verb and comes at the end.

Compare:

**Ik open de toepassing.**
I open the application.

**…als ik de toepassing open.**
…when I open the application.

The order changes because **als** introduces a subordinate clause.

**Openen** is an ordinary inseparable verb. Do not treat it as a separable particle followed by another verb.

Useful forms:

* krijgen → ik krijg → ik kreeg → ik heb gekregen
* openen → ik open → ik opende → ik heb geopend

Useful nouns:

* de foutmelding → de foutmeldingen
* de toepassing → de toepassingen

Because **foutmelding** is a de-word, an attributive adjective normally takes **-e** in **een nieuwe foutmelding**.

### Natural alternative 1

**Er verschijnt een foutmelding als ik de toepassing open.**

**English:** An error message appears when I open the application.

Explain that **er** introduces something appearing in the situation. **Een foutmelding** is the subject, and singular **verschijnt** agrees with it.

This is a natural alternative for reporting the same visible behaviour. It does not add a claim that the application crashes or closes.

### Natural alternative 2

**Bij het openen van de toepassing krijg ik een foutmelding.**

**English:** When opening the application, I get an error message.

Explain that **bij het openen van de toepassing** is one complete first constituent.

The finite verb **krijg** remains second, followed by **ik**.

**Het openen** names the activity using a nominalised infinitive. **Van de toepassing** identifies what is being opened.

### Common mistakes

**Incorrect:** “Als ik open de toepassing…”
**Correct:** “Als ik de toepassing open…”

Explain that the finite verb belongs at the end of this subordinate clause.

**Incorrect:** “Ik krijgen een foutmelding.”
**Correct:** “Ik krijg een foutmelding.”

Explain that the subject **ik** needs the finite form **krijg**, not the infinitive **krijgen**.

### Ten related examples

1. **Ik krijg een foutmelding als ik het bestand open.**
   I get an error message when I open the file.

2. **Ik kreeg een foutmelding toen ik de toepassing opende.**
   I got an error message when I opened the application.

3. **Er verscheen een foutmelding toen ik het bestand opende.**
   An error message appeared when I opened the file.

4. **Ik krijg geen foutmelding meer als ik de toepassing open.**
   I no longer get an error message when I open the application.

5. **Krijg jij ook een foutmelding als je de toepassing opent?**
   Do you also get an error message when you open the application?

6. **De gebruiker krijgt een foutmelding als hij het formulier verstuurt.**
   The user gets an error message when he submits the form.

7. **Als ik opnieuw inlog, verdwijnt de foutmelding.**
   When I sign in again, the error message disappears.

8. **Ik zal de foutmelding opslaan voordat ik de toepassing sluit.**
   I will save the error message before I close the application.

9. **Ik heb de foutmelding genoteerd om die later te onderzoeken.**
   I have noted down the error message so I can investigate it later.

10. **Kun je controleren of de foutmelding nog verschijnt?**
    Can you check whether the error message still appears?

When these become child practice cards, each needs its own suitable situation, translation, and short explanation.

For example, example 2 should describe a particular past event and explain why **toen** fits that event. Example 10 should explain that **of** means **whether** here.

## 9. Grammar coverage across the collection

Build a coverage plan before writing all 600.

Include repeated practice of:

* Present-tense statements and questions.
* Main-clause V2 and fronted time/place phrases.
* Simple past and perfect.
* Future intentions and commitments.
* Modal verbs: kunnen, moeten, mogen, willen, zullen.
* Polite requests with zou/zouden.
* Separable verbs.
* Infinitives with and without te.
* Separable infinitives such as terug te bellen.
* Ongoing actions with aan het.
* Bezig met plus an activity and bezig plus a te-infinitive where natural.
* Negation with niet and geen.
* Direct and indirect objects, including het, me, je, ons, and u.
* Possessives and adjective endings.
* Reflexive constructions.
* Existential and pronominal er.
* Omdat, dat, of, als, toen, terwijl, voordat, nadat, and zodra.
* Purpose with om te.
* Sinds, al, nog, pas, and niet meer.
* Comparisons and quantities.

Use the learner’s previously practised distinctions where they fit:

* weten versus kennen
* gevoel versus voelen
* proberen, probeerde, geprobeerd
* ontdekken versus proberen
* nieuw versus onbekend
* ons versus onze
* aan het versus bezig met
* object placement in perfect and modal sentences

Do not force every grammar pattern into every card.

Do not change a sentence’s meaning merely to create a different tense.

## 10. Alternative answers and Quiz rotation

Publish as many natural, accurately explained answers as a situation supports.

Do not force every card to have three answers. One good answer is acceptable when extra versions would be artificial.

Alternative answers must preserve the relevant:

* Speaker and listener.
* Action and object.
* Time.
* Intention.
* Certainty.
* Permission or obligation.
* Degree of completion.

Simple past and perfect may both fit a completed-event report, but do not assume they are interchangeable in every situation.

Use the existing saved quiz-answer rotation:

* Choose one published answer for each appearance.
* Build tiles from that exact answer.
* Cycle through the available answers in shuffled order.
* Avoid immediately repeating a model when alternatives exist.
* Preserve the model, tile order, and draft through refresh.
* Explain the model actually matched after checking.
* Accept another reviewed word order when the current tiles can form it.
* Preserve the actual answer in Previous card review.
* Do not award points again for refresh, replay, or reviewing history.

Alternative answers belong to the same card’s progress. Do not create a separate ten-success requirement for each wording.

Speaking remains self-rated unless the current project explicitly implements something else. Do not claim automatic speech understanding or pronunciation assessment.

## 11. Ten related examples and gradual child practice

Each new main card must have ten useful related practice examples.

These examples should help the learner transfer a structure to another situation, rather than memorising one fixed sentence.

Use meaningful variation:

* Another action or object.
* Another person.
* Present versus a suitable past form.
* A question.
* A negative statement.
* A future plan.
* Another workplace situation using the same construction.

Do not make all ten examples trivial pronoun substitutions.

Do not attach the same generic set of ten examples to every card. Shared grammar explanations can be reused; the practice content still needs a clear relationship to its parent.

Reuse the current gradual-release system:

* Children start with their own difficulty.
* Enable variations from the parent or an associated child.
* Release a small initial group.
* Unlock further children through the existing learning rules.
* Preserve progress when variations are switched off.
* Keep child progress separate from parent progress.
* Preserve existing completion and retirement behaviour.

The requirement is **6,000 child practice entries associated with the 600 new parents**.

Report both the number of entries and the number of distinct sentences. If some examples are intentionally shared, do not describe all entries as unique authored sentences.

Check for duplicate sentences inside a family and unnecessary overlap with the existing deck.

## 12. Vocabulary section

Extend the existing vocabulary system.

For relevant nouns, include:

* The article.
* The singular.
* The plural where useful.
* The English meaning.
* A short contextual explanation.
* Links to source cards.

For relevant verbs, include:

* The infinitive.
* Useful present, past, and perfect forms.
* Whether the verb is separable or reflexive.
* Relevant prepositions or fixed combinations.

Explain differences such as:

* melding versus foutmelding
* storing versus probleem
* oplossen versus a temporary workaround
* controleren versus onderzoeken
* aanmelden/inloggen versus toegang hebben

Use the existing vocabulary schema and presentation. Merge new source links into an existing vocabulary entry when the word and meaning already exist; do not duplicate it under a new ID unnecessarily.

The vocabulary list remains text-focused. It does not require new images or audio assets.

## 13. Collection selection and existing behaviour

Add a clear way to choose the Dutch at Work collection when creating a session.

Preserve the existing everyday collection and its topic selection.

The old Work topic and the new Dutch at Work collection are not the same thing: existing work-themed cards must keep their IDs and progress.

Session creation must select the requested number of eligible cards from the chosen collection, topic, and learner difficulty.

Do not silently fill a workplace session with everyday cards when the requested pool is too small.

Preserve:

* Fixed session membership across Study, Speaking, and Quiz.
* Saved sessions and offline progress.
* Existing active-session limits.
* Default Difficult ratings for new learners.
* Difficulty persistence.
* Weighted repetition.
* Gradual variations.
* Quiz scoring and retirement.
* Previous card review.
* Existing vocabulary links.
* Existing everyday pictures and recordings.

Older saved sessions must still load. Any new persisted fields need appropriate defaults or migration.

French remains unchanged. Do not offer the new Dutch work cards in French sessions without actual French content.

If the baseline is still 600 Dutch main cards, the completed app should have 1,200 Dutch main cards. Recalculate expectations from the actual repository if the baseline has changed.

## 14. No images; Dutch device audio

The new workplace collection intentionally has no images.

Render pictureless cards cleanly:

* No broken image elements.
* No empty image placeholders.
* No requests for nonexistent illustrations.
* No misleading “image pending” state for intentionally pictureless cards.

Use Dutch device speech for all new main sentences, child sentences, and alternative answers.

Speak the actual selected answer. Never play the original sentence’s recording when displaying a differently worded alternative.

Use an installed Dutch voice. Prefer a suitable Belgian Dutch voice when available and compatible with the existing voice settings.

If no Dutch voice is installed, explain that clearly and keep reading/practice usable. Do not substitute an English voice for Dutch text.

Preserve Listen, Listen slowly, and Stop functionality.

Do not call ElevenLabs or another paid service for this expansion. No API key is required.

Update asset checks so intentional device-audio/pictureless cards are valid while existing recorded and illustrated cards still receive meaningful validation.

## 15. Authoring and language review workflow

Work in batches and save authoring checkpoints.

Before scaling, create several complete benchmark cards covering different structures. Use them to establish consistent quality and then continue autonomously.

For every batch:

1. Check the Dutch for naturalness.
2. Check the English against the Dutch.
3. Check the situation against every answer.
4. Review tense, person, register, and speech act.
5. Review the grammar explanation against the exact sentence.
6. Review vocabulary forms and meanings.
7. Review the related examples and their short explanations.
8. Check duplication against existing content and the new batches.

Use language authorities such as Taaladvies.net, Team Taaladvies, or the Algemene Nederlandse Spraakkunst to resolve genuine uncertainty. Record sources actually consulted.

Do not invent citations or claim native-speaker certification. Distinguish AI editorial review from independent human review.

Automation may assemble and validate authored material, but unrestricted automatic conjugation, word substitution, or English-to-Dutch templates must not be treated as reviewed content.

A grammatically valid alternative can still be wrong for a particular situation. Review both grammar and meaning.

Avoid presenting inappropriate workplace behaviour as normal support practice—for example, asking a user to send their password or verification code.

## 16. Implementation and testing

Keep the existing architecture. Inspect the relevant code rather than assuming file names or interfaces are unchanged.

Make the smallest maintainable changes needed to support the collection and its content.

Check all affected paths, including:

* Card discovery and lookup.
* Collection/topic selection.
* Card and session validation.
* Grammar notes and breakdowns.
* Vocabulary lookup and backlinks.
* Child lookup and unlocking.
* Model-answer lookup and rotation.
* Quiz token creation and scoring.
* Audio routing.
* Sentence pages.
* Counts, statistics, and completion text.
* Offline storage and server synchronisation.
* Service-worker or caching assumptions.
* Asset validation.
* Existing French behaviour.

Do not weaken tests simply to accept missing content or make a larger card count pass.

Add meaningful validation for:

* Exactly 600 new main cards.
* Exactly 60 per workplace area.
* Stable and unique IDs.
* No exact normalised duplicates against the published existing content.
* Review of near-duplicate or superficial rewordings.
* Complete prompts, translations, explanations, and vocabulary references.
* Ten valid child entries per new main card.
* Valid alternative answer IDs.
* Quiz-compatible token lengths.
* Intentional absence of images and recordings.
* Correct Dutch device speech selection.
* Old saved-session compatibility.

Exercise the app in a browser at phone and desktop widths.

Check that:

* A workplace session contains the chosen workplace cards.
* All three modes share that set.
* Prompts hide model answers until the appropriate reveal/check.
* Variations release gradually and preserve their own progress.
* Rotating answers produce the correct tiles and explanations.
* Refresh preserves the current puzzle.
* Previous card does not change progress.
* Device audio speaks the displayed model.
* Pictureless cards have a clean layout.
* Existing everyday and French sessions still work.

Run the repository’s appropriate lint, unit tests, content checks, asset checks, production build, and isolated flashcard browser suite.

Do not use a live production database for testing. Report skipped or unavailable checks honestly.

Automated tests establish structural and behavioural correctness; they do not replace language review.

## 17. Final review

Before delivery, review the changes as a strict senior engineer and a careful Dutch teacher.

Look specifically for:

* Inaccurate or awkward translations.
* Prompts that require information absent from the answer.
* Explanations copied from the wrong construction.
* Incorrect verb forms or auxiliary choices.
* Confusion between je/jij, u/uw, ons/onze, and de/het.
* Over-absolute claims about Dutch word order.
* Alternative answers with different meanings.
* Duplicate content used to inflate totals.
* Child examples that do not match the parent’s learning goal.
* Lost progress or changed existing IDs.
* Audio speaking a different sentence.
* Broken images on intentionally pictureless cards.
* Hard-coded assumptions that there are only 600 main cards.
* Environment-specific absolute paths in committed code or tests.

Fix the issues found and rerun the relevant checks.

## 18. Deliver the completed result

Provide the implemented local changes and a downloadable update package.

The package should include:

* The new authored content.
* Required application changes.
* Tests and validation scripts.
* A content/grammar coverage report.
* A concise review and validation report.
* A patch against the actual starting revision.
* A README.
* A safe installer where appropriate.

The installer must check compatibility before editing files and refuse conflicting or uncommitted tracked changes. It must not reset, silently stash, or overwrite unrelated work.

Exclude credentials, local environment files, dependency folders, build output, and personal data.

Verify that applying the patch to its matching clean base reproduces the intended changed files.

Do not push, merge, or deploy as part of this download-and-install assignment unless separately instructed.

The final report must state actual counts:

* New main cards.
* Cards per workplace area.
* Child practice entries.
* Distinct child sentences.
* Model answers.
* Vocabulary additions and updated links.
* Checks passed, failed, or skipped.
* Any genuine remaining limitations.

Do not describe unfinished batches, placeholders, or unreviewed generated material as a completed 600-card collection.
