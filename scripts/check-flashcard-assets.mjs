import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const originals = JSON.parse(await readFile(new URL('data/flashcards.json', root), 'utf8'));
const additions = JSON.parse(await readFile(new URL('data/flashcard-additions.json', root), 'utf8'));
const cards = [...originals, ...additions];
const seen = new Set();
const images = new Set();
const audio = new Set();
const imageHashes = new Set();
const errors = [];
let readyImages = 0, readyAudio = 0;
for (const card of cards) {
  if (seen.has(card.id)) errors.push(`Duplicate ID: ${card.id}`);
  seen.add(card.id);
  for (const [kind, paths] of [['image', images], ['audio', audio]]) {
    const path = card[kind];
    if (paths.has(path)) errors.push(`Reused ${kind} path: ${path}`);
    paths.add(path);
    const ready = !card[`${kind}Status`] || card[`${kind}Status`] === 'ready';
    if (!ready) continue;
    try {
      const file = new URL(`public${path}`, root);
      if ((await stat(file)).size === 0) throw new Error('empty file');
      if (kind === 'image') {
        const bytes = await readFile(file);
        if (bytes.subarray(0, 4).toString() !== 'RIFF' || bytes.subarray(8, 12).toString() !== 'WEBP') throw new Error('not WebP');
        const hash = createHash('sha256').update(bytes).digest('hex');
        if (imageHashes.has(hash)) errors.push(`Repeated illustration bytes: ${card.id}`);
        imageHashes.add(hash); readyImages++;
      } else readyAudio++;
    } catch (error) { errors.push(`${card.id}: ${kind}: ${error.message}`); }
  }
}
console.log(JSON.stringify({ cards: cards.length, additions: additions.length, readyImages, pendingImages: cards.length - readyImages, readyAudio, awaitingRecordings: cards.length - readyAudio, errors }, null, 2));
if (cards.length !== 300 || additions.length !== 250 || errors.length || (process.argv.includes('--complete') && (readyImages !== cards.length || readyAudio !== cards.length))) process.exitCode = 1;
