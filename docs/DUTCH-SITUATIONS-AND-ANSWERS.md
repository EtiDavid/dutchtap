# Dutch situations and rotating quiz answers

This update builds on gradual Dutch variation practice. Speaking and Quiz now use authored situations that match the intended meaning, people, time, and speech act. For example, **een nieuw gerecht** is prompted as a new dish, not an unknown or unfamiliar dish. A command to sell a car is addressed to its owner; it is not rewritten as a question about whether the car has been sold.

## Learner behaviour

- All 600 main Dutch cards have reviewed situation prompts. The ten children of every main card resolve to situation prompts too. Study retains its original sentence-first format.
- Answers are useful model responses, not an exhaustive list of everything a fluent speaker might say. Some situations have one model; others have two, three, or four. Extra versions are not added solely to meet a quota.
- Each model has its own English meaning and explanation. The original main-card breakdown, vocabulary links, recorded audio, images, and ten related grammar examples remain available. Each child also has ten related examples from its family.
- Speaking reveals the original model plus the other natural ways to convey the situation. Speaking remains learner-rated: the app does not automatically listen to, transcribe, or assess speech.
- A Dutch quiz round chooses a model from that card's shuffled answer cycle and builds tiles from that exact sentence. Every published model appears once in a cycle; the first model of the next cycle cannot repeat the previous model when alternatives exist. One-model cards repeat their one model.
- The chosen model, tiles, unfinished draft, and rotation cycle are saved. Refreshing or reopening does not change the current puzzle. Switching between Speaking and Quiz retains each mode's own round.
- The prompt gives the situation before the answer; the direct English model translation is shown after checking. Learners must use every tile. A different reviewed answer with the same word tiles in another order is accepted and gets its own matching explanation.
- A valid Dutch response outside the reviewed inventory may still be rejected by Quiz. Feedback says the order did not match a reviewed answer, rather than claiming it is necessarily ungrammatical. Speaking supports self-assessment of other natural responses.
- Correct answers still earn ten points. The card shares one streak across its model wordings; ten consecutive correct answers retire that card. Alternative models are not extra child cards and do not each require ten more successes.
- Previous card shows the actual model accepted or displayed in that quiz round. Reviewing never changes scores or ratings.
- Original sentence models retain their recordings. Alternative sentences and child examples use Dutch device speech. No paid audio generation, new illustration assets, or API credentials are required.
- French content and its existing quiz behaviour are unchanged.

For `Ik probeerde een nieuw gerecht.`, the authored situation is:

> Yesterday, you visited a restaurant and tried a new dish. You are telling a friend about the visit. Say what you tried.

The published models are:

1. `Ik probeerde een nieuw gerecht.` — simple past.
2. `Ik heb een nieuw gerecht geprobeerd.` — perfect reporting the completed experience.
3. `In het restaurant probeerde ik een nieuw gerecht.` — fronted place phrase followed by finite verb and subject.

This situation supports the restaurant detail in model 3. It does not turn trying a dish into cooking it or merely intending to try it.

## Content and maintenance

`data/editorial/dutch-main-scenarios.tsv` contains 600 main prompts. `dutch-example-scenarios.tsv` contains 340 additional distinct example prompts. Fifty of the 390 bank sentence pairs already occur among the main cards, so their main prompts are reused. This produces **940 distinct sentence tasks** used by 600 main cards and 6,000 family child entries. Those entries intentionally reuse the previously authored grammar bank; they are not 6,000 unique new sentences.

`dutch-answer-alternatives.tsv` supplies explicit alternatives with explanations. The assembler also uses narrow standard-form rules for full and unstressed pronouns, selected modal forms, and common requests. Time-fronting alternatives are restricted to the reviewed list in `dutch-v2-reviewed.json`. No runtime translation or unrestricted tense transformation is used.

The compiled catalogue has **1,488 model answers across 940 distinct tasks; 449 tasks have multiple models, with a maximum of four**. It is checked into `data/dutch-communication.json`. Rebuild it with:

```bash
python3 scripts/assemble-dutch-communication.py
```

Run the earlier practice authoring scripts first if their inputs were changed. Rebuilding the communication catalogue is byte-for-byte idempotent for unchanged editorial inputs. If a Dutch sentence text is edited, update its authored prompt/model association too.

Original models use the stable ID `model`; additional models use a hash of their exact Dutch text. Saved attempts refer to those IDs. Do not delete a published model or reassign its meaning without a migration for existing current rounds, rotation queues, and review history.

## Persistence and compatibility

The same reducer chooses and scores answers on the device and server. Model and tile shuffles are seeded by the saved attempt ID, so an offline action replay selects the same model. Duplicate submissions cannot score a second time.

New optional schema fields are `QuizCurrent.answerId`, `QuizCurrent.outcome.answerId`, per-card `quizAnswerRotation`, and session `quizReview`. Old saved rounds without `answerId` retain their original tiles and model. New Dutch UI actions opt into rotation with `rotateAnswers: true`. This explicit action flag preserves old queued quiz actions; French continues on its original model.

All existing session limits, independent child difficulty, gradual unlocking, original card completion, and account revision checks remain in place. The latest 100 quiz reviews retain the actual answer ID alongside the existing card history.

See `DUTCH-SITUATIONS-VALIDATION.md` for validation results and the delivery package README for installation.
