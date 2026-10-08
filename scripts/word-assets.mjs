#!/usr/bin/env node
// Lists every noun and adjective that needs a picture and a sound, with ready-to-paste
// image prompts and the exact file names to save. Run: npm run assets:words
//   npm run assets:words            -> writes docs/word-assets/WORD-ASSETS.json (everything) and prints a summary
//   npm run assets:words -- --missing   -> only entries that still lack a picture or a sound
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');

// The data files only use type imports, so transpiling them is enough to read them.
function load(file) {
  const js = ts.transpileModule(readFileSync(join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(js, { module: mod, exports: mod.exports, require: () => ({}) });
  return mod.exports;
}
const { NOUNS } = load('data/nouns.ts');
const { ADJECTIVES } = load('data/adjectives.ts');

const STYLE = 'Square 1:1, one clear subject centred on a plain soft off-white background, friendly hand-painted editorial style, warm terracotta, sage green and soft blue palette, no text, letters, numbers, labels, borders or watermark.';
const has = (dir, id, exts) => exts.some(e => existsSync(join(root, 'public/words', dir, `${id}.${e}`)));

const entries = [
  ...NOUNS.map(n => ({
    kind: 'noun', id: n.id, dutch: `${n.article} ${n.singular}`, english: n.englishSingular, category: n.category,
    imageFile: `public/words/nouns/${n.id}.webp`, audioFile: `public/words/nouns/${n.id}.mp3`,
    speak: `${n.article} ${n.singular}`,
    imagePrompt: `A simple, instantly recognisable illustration of: ${n.englishSingular}. ${STYLE}`,
    hasImage: has('nouns', n.id, ['webp', 'png', 'jpg']), hasAudio: has('nouns', n.id, ['mp3']),
  })),
  ...ADJECTIVES.map(a => ({
    kind: 'adjective', id: a.id, dutch: a.base, english: a.english,
    imageFile: `public/words/adjectives/${a.id}.webp`, audioFile: `public/words/adjectives/${a.id}.mp3`,
    speak: a.base,
    imagePrompt: `An illustration that clearly shows the quality "${a.english}" using a simple everyday object or scene (the picture must make the meaning obvious without words). ${STYLE}`,
    hasImage: has('adjectives', a.id, ['webp', 'png', 'jpg']), hasAudio: has('adjectives', a.id, ['mp3']),
  })),
];

const onlyMissing = process.argv.includes('--missing');
const out = entries.filter(e => !onlyMissing || !e.hasImage || !e.hasAudio);
const dir = join(root, 'docs/word-assets');
mkdirSync(dir, { recursive: true });
const file = join(dir, onlyMissing ? 'WORD-ASSETS-MISSING.json' : 'WORD-ASSETS.json');
writeFileSync(file, JSON.stringify(out, null, 2) + '\n');

const pendingNounImageFile = join(dir, 'NOUN-IMAGE-PROMPTS-PENDING.json');
const pendingNounImages = entries
  .filter(entry => entry.kind === 'noun' && !entry.hasImage)
  .map(({ id, dutch, english, category, imageFile, imagePrompt }) => ({
    id, dutch, english, category, imageFile, imagePrompt,
  }));
writeFileSync(pendingNounImageFile, JSON.stringify(pendingNounImages, null, 2) + '\n');

const count = (k, f) => entries.filter(e => e.kind === k && f(e)).length;
for (const kind of ['noun', 'adjective']) {
  const total = entries.filter(e => e.kind === kind).length;
  console.log(`${kind}s: ${count(kind, e => e.hasImage)}/${total} pictures, ${count(kind, e => e.hasAudio)}/${total} sounds`);
}
console.log(`Wrote ${out.length} entries to ${file.replace(root + '/', '')}`);
console.log(`Wrote ${pendingNounImages.length} pending noun prompts to ${pendingNounImageFile.replace(root + '/', '')}`);
