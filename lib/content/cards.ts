import { CARDS, type Card } from "@/lib/flashcards/engine";
import { meaningFor, scenarioFor } from "@/lib/practice/communication";
import frCards from "@/data/fr/cards.json";
import { DEFAULT_LANG, type Lang } from "@/lib/lang";
import { situationNlFor } from "@/lib/grammarAnalysis";

/**
 * One sentence card as the learner sees it in a given language. The situation (id, topic, picture, scenario and cue) is shared;
 * the sentence, its English meaning, variation, notes and vocabulary belong to the language. Everything that shows a sentence
 * (Study, Speaking, Quiz, sentence pages, notes, vocabulary, speech) resolves cards here, so none of it hard-codes a language.
 */
export type LCard = {
  collection: "everyday" | "workplace" | "grammar";
  id: string;
  lang: Lang;
  category: string;
  /** The sentence being learned, in `lang`. */
  text: string;
  english: string;
  scenario: string;
  scenarioNl?: string;
  cue: string;
  variation: string;
  /** The English meaning of the variation (French cards). */
  variationEnglish?: string;
  difficulty: string;
  vocabularyIds: string[];
  image: string;
  imageStatus?: string;
  /** A recording path. Only Dutch cards have recordings; French is spoken by the device voice. */
  audio?: string;
  audioStatus?: string;
  adapted?: boolean;
  /** Where the sentence text came from, for the review table. */
  review?: FrenchReview;
};

export type FrenchReview = {
  status: "ai-reviewed";
  register: "tu" | "vous" | "neutral";
  note?: string;
};

export type FrenchCardRecord = {
  id: string;
  text: string;
  english: string;
  variation: string;
  variationEnglish: string;
  vocabularyIds: string[];
  register?: "tu" | "vous" | "neutral";
  note?: string;
  /** Only when the English meaning or scenario of the shared situation had to differ from the Dutch card. */
  scenario?: string;
  cue?: string;
  difficulty?: string;
};

const dutchById = new Map<string, Card>(CARDS.map((card) => [card.id, card]));
const frenchById = new Map<string, FrenchCardRecord>(
  (frCards as FrenchCardRecord[]).map((record) => [record.id, record]),
);

function dutchCard(card: Card): LCard {
  return {
    id: card.id,
    lang: "nl",
    collection: card.collection ?? "everyday",
    category: card.category,
    text: card.dutch,
    english: meaningFor(card.dutch, card.english),
    scenario: scenarioFor(card.dutch, card.scenario),
    scenarioNl: card.scenarioNl ?? situationNlFor(card.id),
    cue: card.cue,
    variation: card.variation,
    difficulty: card.difficulty ?? "beginner",
    vocabularyIds: card.vocabularyIds ?? [],
    image: card.image,
    imageStatus: card.imageStatus,
    audio: card.audio || undefined,
    audioStatus: card.audioStatus,
    adapted: card.adapted,
  };
}
function frenchCard(shared: Card, record: FrenchCardRecord): LCard {
  return {
    id: shared.id,
    lang: "fr",
    collection: "everyday",
    category: shared.category,
    text: record.text,
    english: record.english,
    scenario: record.scenario ?? shared.scenario,
    cue: record.cue ?? shared.cue,
    variation: record.variation,
    variationEnglish: record.variationEnglish,
    difficulty: record.difficulty ?? shared.difficulty ?? "beginner",
    vocabularyIds: record.vocabularyIds,
    image: shared.image,
    imageStatus: shared.imageStatus,
    review: {
      status: "ai-reviewed",
      register: record.register ?? "neutral",
      note: record.note,
    },
  };
}

const cache: Record<Lang, Map<string, LCard>> = {
  nl: new Map(),
  fr: new Map(),
};
for (const card of CARDS) cache.nl.set(card.id, dutchCard(card));
for (const card of CARDS) {
  const record = frenchById.get(card.id);
  if (record) cache.fr.set(card.id, frenchCard(card, record));
}

/** A card by id in the chosen language, or undefined when that language has no (reviewed) content for it. */
export const cardFor = (lang: Lang, id: string): LCard | undefined =>
  cache[lang].get(id);
export const hasContent = (lang: Lang, id: string): boolean =>
  cache[lang].has(id);
/** The published pool for a language, in the shared deck order. Cards without content in that language are never offered. */
export const cardsFor = (lang: Lang): LCard[] =>
  CARDS.flatMap((card) => {
    const found = cache[lang].get(card.id);
    return found ? [found] : [];
  });
export const sharedCard = (id: string): Card | undefined => dutchById.get(id);
export { DEFAULT_LANG };
