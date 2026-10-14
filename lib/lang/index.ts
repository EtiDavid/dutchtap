/** The languages a learner can study. Learning language is separate from the interface language (English). */
export const LANGS = ['nl', 'fr'] as const;
export type Lang = typeof LANGS[number];
export const DEFAULT_LANG: Lang = 'nl';

export const LANG_INFO: Record<Lang, { native: string; english: string; flag: string; speech: readonly string[]; blurb: string }> = {
  nl: { native: 'Nederlands', english: 'Dutch', flag: '🇳🇱', speech: ['nl-be', 'nl-nl', 'nl'], blurb: 'Everyday Dutch sentences with recordings' },
  fr: { native: 'Français', english: 'French', flag: '🇫🇷', speech: ['fr-be', 'fr-fr', 'fr'], blurb: 'The same situations in everyday French' },
};

export const isLang = (value: unknown): value is Lang => typeof value === 'string' && (LANGS as readonly string[]).includes(value);
/** A validated language from a URL parameter or stored value, or null when it is missing or not a supported language. */
export const parseLang = (value: string | null | undefined): Lang | null => (isLang(value) ? value : null);

/**
 * Appends the language to a path. Dutch links stay exactly as they always were (so every old link keeps working);
 * French links name their language explicitly so a reload, a shared link or the back button can never flip the learner to Dutch.
 */
export function withLang(path: string, lang: Lang): string {
  if (lang === DEFAULT_LANG) return path;
  const hash = path.indexOf('#');
  const base = hash >= 0 ? path.slice(0, hash) : path;
  const fragment = hash >= 0 ? path.slice(hash) : '';
  return `${base}${base.includes('?') ? '&' : '?'}lang=${lang}${fragment}`;
}
