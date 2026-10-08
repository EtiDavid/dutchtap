# DutchTap redesign — requirements and plan

Status: **all five steps are built (flashcards, quiz, Home, word picture/sound slots, docs).**

## 1. What you asked for (your words, organised)

**Overall goal:** make the whole app very easy to understand.

**Home screen order:** the Flashcards section comes first.

### Flashcards section — two modes
The point of flashcards is to **memorise the words and practise reading and thinking**.

1. **Read mode (Dutch words/sentences).** Shows the Dutch, to read and think about. Each mode shows a short description of its intention, so the user knows what it is for.
2. **Say-it mode (from memory).** Shows **only the picture plus a small English description**, with the prompt "How do you say it?".
   - Example: a picture of the man in the bakery wanting to pay. The small text says "want to pay". The card asks "How do you say it?".
   - The user says it out loud, then presses a button to check what it is in Dutch.

### Quiz section — separate from flashcards
- Lives outside flashcards but **uses the same pictures and statements**.
- The user fills in the words by tapping. This is the quiz that was just built (fill the blank and word order).

### de/het and adjectives
- The de/het section **needs room for images**. Adjectives need the same.
- You (via ChatGPT) will add the images and sounds to the words.

### Flashcard behaviour
- Cards are **shuffled**.
- Before moving to the next card, the user **must choose a level for that card**: **Easy, Medium, Difficult or Mastered**.
- The **default level for every card is Difficult**.
- The next time a card appears, its level is **pre-selected to the user's last choice**.
- **Difficult cards show more often. Mastered cards show less** (after the user has marked it mastered, about 10 times, it appears much less).

### Quiz behaviour
- A card answered correctly about **10 times** starts repeating **less**.

## 2. How I understand it / what I plan to build

### Screens
```
Home
 ├─ Flashcards    (first)
 │    ├─ Read mode    — Dutch shown; read, listen, think
 │    └─ Say-it mode  — picture + small English; "How do you say it?"; Check button
 ├─ Quiz          — tap the missing word / tap the words into order (same pictures)
 ├─ de / het      — noun articles, with an image slot (and sound) per word
 └─ Adjectives    — with an image slot (and sound) per word
```
The current separate modes (de/het, deze/dit, adjective endings) stay, but are reached from simple, clearly labelled cards on Home.

### Flashcard level and frequency
- Each card stores a `level`: `difficult` (default) | `medium` | `easy` | `mastered`.
- The level buttons are required to continue. The last choice is highlighted when the card returns.
- Proposed weights when drawing the next card (tunable). Level order is Difficult, Medium, Easy, Mastered:

  | Level | How often it appears |
  | --- | --- |
  | Difficult | most often (e.g. weight 8) |
  | Medium | often (e.g. 4) |
  | Easy | sometimes (e.g. 2) |
  | Mastered | rarely (e.g. 0.5), and rarer after repeated "Mastered" choices |

- "Mastered about 10 times" means the card is rated Mastered 10 times in total, after which it appears even less. The first Mastered choice already lowers its weight.

### Quiz frequency
- Each card counts correct answers. Around 10 correct answers (and no recent mistake) reduces how often it is chosen. A wrong answer brings it back more often.

### Images and sounds for words
- Each noun and adjective gets an optional `image` and `audio` path, like flashcards already have.
- The screen shows a clear placeholder where the image goes until a file exists, so nothing looks broken.
- Same workflow as flashcards: I write prompts and a file list; you generate pictures with ChatGPT, record or generate audio, and drop them in `public/`.

### Making it easy to understand
- One short sentence under each mode and section describing what it is for.
- Plain labels ("Read", "Say it", "Quiz") instead of technical terms.
- One main action per screen.

## 3. Proposed order of work
1. **Flashcard rewrite:** two modes, shuffle, four levels with default Difficult, level pre-selected on return, weighted frequency. Unit tests for the weighting, and browser tests.
2. **Quiz section:** move the existing quiz out of flashcards into its own section using the same cards, with the 10-correct slow-down.
3. **Home screen reorganisation** and mode descriptions.
4. **Image and sound slots** for de/het, deze/dit and adjectives, with placeholders and a prompt list for you.
5. Update docs and tests.

## 4. Decisions (answered)
1. **Frequency order:** Difficult > Medium > Easy > Mastered (most to least often). Confirmed.
2. **Schedule:** the 1/3/7/14/30-day schedule and the daily limits are dropped. There is no score and no points.
3. **Old progress:** start fresh (every card begins as Difficult). Old flashcard records are ignored. *(My recommendation. Nothing was ever deployed, so nothing is lost. Say so if you want it converted.)*
4. **Say-it text:** not a translation. It is a short *situation* telling the user what they need to say, written for each card. Example for "Ik spreek een beetje Nederlands.": "You need to tell someone that you only speak a little Dutch." I will write one for each card.
5. **Quiz scope:** the picture sentences only for now. *(Default. Not yet confirmed.)*
6. **Account sync:** levels and counters sync to the account like other progress. *(Default. Not yet confirmed.)*

### Starting a session
When the user starts flashcards, a pop-up asks **"How many cards do you want to practise?"** with the options **10 / 20 / 30 / Unlimited** (exact choices to confirm).
- **A number (e.g. 10):** that many cards are picked at random, favouring Difficult ones. The number is the size of the *set*, not the number of questions. The session keeps cycling through those cards, showing Difficult ones more often, until the user ends it. It does not stop after 10 questions.
- **Unlimited:** the user has access to the whole deck.
- No score is kept in either case. The user finishes whenever they want.

## 5. Not decided yet (my suggestions)
- A visible count on Home of how many cards are Mastered.
- Letting the user pick one of the five places (shopping, school, …) before shuffling.
