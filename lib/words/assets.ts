import type { AdjectiveEntry, NounEntry } from "@/data/types";

/**
 * Pictures and sounds for words are found by file name alone — drop a file named
 * after the word's id into the folder and it appears; nothing else to edit.
 *
 *   public/words/nouns/<id>.webp|png|jpg    picture      public/words/nouns/<id>.mp3    sound
 *   public/words/adjectives/<id>.webp|png|jpg            public/words/adjectives/<id>.mp3
 */
export const IMAGE_EXTENSIONS = ["webp", "png", "jpg"] as const;
export type WordKind = "noun" | "adjective";

export const wordAssetBase = (kind: WordKind, id: string) => `/words/${kind === "noun" ? "nouns" : "adjectives"}/${id}`;
export const wordAudioUrl = (kind: WordKind, id: string) => `${wordAssetBase(kind, id)}.mp3`;

/** What the speaker should say: the noun with its article, or the plain adjective. */
export const nounSpeech = (noun: NounEntry, plural = false) => (plural ? `de ${noun.plural}` : `${noun.article} ${noun.singular}`);
export const adjectiveSpeech = (adjective: AdjectiveEntry) => adjective.base;
