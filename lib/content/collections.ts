import { CATEGORIES } from '@/lib/flashcards/engine';
import type { Lang } from '@/lib/lang';

export const COLLECTIONS = ['everyday', 'workplace'] as const;
export type Collection = typeof COLLECTIONS[number];
export const COLLECTION_LABELS: Record<Collection, string> = {
  everyday: 'Everyday', workplace: 'Dutch at Work',
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
export const topicsFor = (collection: Collection) => collection === 'workplace' ? WORK_AREAS : CATEGORIES;
export const collectionAvailable = (lang: Lang, collection: Collection) => lang === 'nl' || collection === 'everyday';
export const validTopic = (collection: Collection, topic: string) => topic === 'all' || Object.hasOwn(topicsFor(collection), topic);
