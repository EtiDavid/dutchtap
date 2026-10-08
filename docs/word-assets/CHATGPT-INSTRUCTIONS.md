# Adding pictures and sounds to words (for you or ChatGPT)

The de/het, deze/dit and adjective games already have a **picture slot** and a **Listen
button** for every word. Until a file exists the slot shows a dashed placeholder that
names the file it is waiting for. **Adding a file with the right name is all it takes** —
no code, no list to edit.

## Where files go

| What | Folder | File name |
| --- | --- | --- |
| Noun picture | `public/words/nouns/` | `<id>.webp` (`.png` or `.jpg` also work) |
| Noun sound | `public/words/nouns/` | `<id>.mp3` |
| Adjective picture | `public/words/adjectives/` | `<id>.webp` (`.png` or `.jpg` also work) |
| Adjective sound | `public/words/adjectives/` | `<id>.mp3` |

`<id>` is the word's `id` in the list below (for example `tafel`, `huis`, `mooi`).
Reload the game and the placeholder is replaced.

## The list

Run this to (re)build the list and see progress:

```bash
npm run assets:words              # everything  -> docs/word-assets/WORD-ASSETS.json
npm run assets:words -- --missing # only what is still missing -> WORD-ASSETS-MISSING.json
```

Each entry looks like this:

```json
{
  "kind": "noun", "id": "tafel", "dutch": "de tafel", "english": "table",
  "imageFile": "public/words/nouns/tafel.webp",
  "audioFile": "public/words/nouns/tafel.mp3",
  "speak": "de tafel",
  "imagePrompt": "A simple, instantly recognisable illustration of: table. Square 1:1, …"
}
```

## Prompt to give ChatGPT

Paste about 20 entries from `WORD-ASSETS-MISSING.json` at a time after this message:

> For each entry below, create one image using its `imagePrompt` and name the file
> exactly the last part of `imageFile` (for example `tafel.webp`). Keep every image
> square, in the same style, with no text in it. Give me the images as a single zip.
> Then, for each entry, record the Dutch text in `speak` read clearly at a natural
> pace by a native-sounding Dutch (Belgian or Netherlands) voice, and name the audio
> exactly the last part of `audioFile` (for example `tafel.mp3`).

Then unzip into `public/words/nouns/` (or `adjectives/`) and run
`npm run assets:words` to see the new counts.

## Notes

- Nouns are spoken **with their article** (`de tafel`, `het huis`) — the sound is only
  shown after the learner answers, so it doesn't give the answer away. For plural
  questions the app uses the device's Dutch voice instead.
- Have a Dutch speaker check pronunciation before publishing, as with the flashcards.
- Keep pictures small (about 512×512, under ~100 KB) so the games stay fast.
