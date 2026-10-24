import index from '@/data/audio-index.json';
type Recording = { text: string; lang: string; path: string };
const recordings = new Map((Object.values(index.items) as Recording[]).map(item => [`${item.lang}\u0000${item.text}`, item.path]));
export const recordingFor = (text: string, lang: string): string | undefined => recordings.get(`${lang}\u0000${text}`);
