import { LANG_INFO, type Lang } from './index';

/** The few phrases of interface text that name the language being learned. The interface itself stays in English. */
export function copy(lang: Lang) {
  const language = LANG_INFO[lang].english;
  return {
    language,
    checkAnswer: `Check the ${language}`,
    otherOrders: `Other ${language} word orders can also be valid, so tap the words in the order you learned.`,
    correct: lang === 'fr' ? 'Exact !' : 'Juist!',
    wordsHint: `Words of the ${language} sentence`,
    searchPlaceholder: lang === 'fr' ? 'French, English or French explanation' : 'Dutch, English or Dutch explanation',
  };
}
