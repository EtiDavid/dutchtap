import { CATEGORIES } from '@/lib/flashcards/engine';
import type { Lang } from '@/lib/lang';

export const COLLECTIONS = ['everyday', 'workplace', 'grammar'] as const;
export type Collection = typeof COLLECTIONS[number];
export const COLLECTION_LABELS: Record<Collection, string> = {
  everyday: 'Everyday', workplace: 'Dutch at Work', grammar: 'Grammar patterns',
};
export const WORK_AREAS = {
  office: 'Office conversation and introductions',
  clarification: 'Help, clarification and repetition',
  support: 'User support and support requests',
  problems: 'Problems and their impact',
  troubleshooting: 'Troubleshooting and explaining steps',
  meetings: 'Meetings and progress updates',
  priorities: 'Tasks, priorities and deadlines',
  changes: 'Changes, testing, access and permission',
  incidents: 'Incidents, escalation and handovers',
  remote: 'Email, chat and remote collaboration',
} as const;
export const GRAMMAR_AREAS = {
  inversion: 'Verb second & inversion',
  omdat: 'Omdat · explain a reason',
  dat: 'Dat · say what you think',
  als: 'Als · conditions & repeated situations',
  wanneer: 'Wanneer · when & questions',
  terwijl: 'Terwijl · while',
  voordat: 'Voordat · before',
  nadat: 'Nadat · after',
  tot: 'Tot · until something happens',
  toen: 'Toen · one past occasion',
  verbs: 'Verbs in context',
  separable: 'Separable verbs',
  tense: 'Present, past & perfect',
} as const;
/** What the "place" choice is called for each collection, so the Create session form says the right thing. */
export const TOPIC_WORDS: Record<Collection, { field: string; all: string; plural: string }> = {
  everyday: { field: 'Place (topic)', all: 'All places', plural: 'all places' },
  workplace: { field: 'Workplace area', all: 'All workplace areas', plural: 'all workplace areas' },
  grammar: { field: 'Grammar pattern', all: 'All patterns', plural: 'all patterns' },
};
export const topicsFor = (collection: Collection) => collection === 'workplace' ? WORK_AREAS : collection === 'grammar' ? GRAMMAR_AREAS : CATEGORIES;
/** Work and grammar patterns are Dutch-only; French has only its Everyday sentences. */
export const collectionAvailable = (lang: Lang, collection: Collection) => lang === 'nl' || collection === 'everyday';
export const validTopic = (collection: Collection, topic: string) => topic === 'all' || Object.hasOwn(topicsFor(collection), topic);
