import index from '@/data/audio-index.json';
import { resolveRecordingUrl } from './audio-url';

type Recording = { text: string; lang: string; path: string };
const recordings = new Map((Object.values(index.items) as Recording[]).map(item => [`${item.lang}\u0000${item.text}`, item.path]));

/** Resolves only indexed Dutch utterances to R2; all other audio URLs stay unchanged. */
export const recordingFor = (text: string, lang: string): string | undefined => {
  const path = recordings.get(`${lang}\u0000${text}`);
  return path ? resolveRecordingUrl(path) : undefined;
};
