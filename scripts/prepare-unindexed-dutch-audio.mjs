// Read-only source-index audit and an ElevenLabs-ready manifest for missing DutchTap audio.
// Does not contact ElevenLabs or R2, consume credits, or change the app's audio index.
// Usage: node scripts/prepare-unindexed-dutch-audio.mjs
// Then review audio-export/unindexed-dutch/manifest.json before running the existing generator.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
const index = read('audio-index.json');
if (index.version !== 1 || !index.items || Array.isArray(index.items))
  throw Error('Unexpected Dutch audio index');
const hash = text => createHash('sha256').update('nl\0' + text).digest('hex').slice(0, 24);
const indexed = new Set(Object.values(index.items).filter(x => x.lang === 'nl').map(x => x.text));
const selected = new Map();
const all = new Map();
function add(value, role, usedInApp = false) {
  if (typeof value !== 'string' || !value.trim()) return;
  const text = value.trim();
  const previous = all.get(text) || { roles: new Set(), usedInApp: false };
  previous.roles.add(role);
  previous.usedInApp ||= usedInApp;
  all.set(text, previous);
  if (indexed.has(text)) return;
  selected.set(text, previous);
}
const everyday = read('dutch-practice-bank.json');
const everydayRefs = read('dutch-variations.json');
const workplace = read('workplace-practice-bank.json');
const workplaceRefs = read('workplace-families.json');
const grammar = read('grammar-variation-families.json');
// All authored pairs, including not-yet-used ones, are included to prevent the next card
// variation from becoming silent when a learner reaches it.
for (const [pattern, group] of Object.entries(everyday))
  for (const pair of group.pairs || []) add(pair[0], 'everyday-bank:' + pattern);
for (const [parent, family] of Object.entries(everydayRefs))
  for (const i of family.indices || []) add(everyday[family.pattern]?.pairs?.[i]?.[0], 'everyday-card:' + parent, true);
for (const [pattern, group] of Object.entries(workplace))
  for (const e of group.examples || []) add(e.text, 'workplace-bank:' + pattern);
for (const [parent, family] of Object.entries(workplaceRefs))
  for (const i of family.indices || []) add(workplace[family.group]?.examples?.[i]?.text, 'workplace-card:' + parent, true);
for (const [parent, children] of Object.entries(grammar))
  for (const child of children) {
    add(child.text, 'grammar-card:' + parent, true);
    add(child.example?.text, 'grammar-example:' + parent);
    add(child.scenarioNl, 'grammar-prompt:' + parent);
  }
// Add main cards, written model answers and vocabulary via the app's existing
// comprehensive source collector. The full source-audit script remains the
// authority for all other prompts/lessons/verbs.
const missing = [...selected].map(([text, meta]) => ({
  id: hash(text), lang: 'nl', text, roles: [...meta.roles].sort(),
  approved: true, existingAudio: '',
  review: 'Source-authored DutchTap text, approved for recording; native-speaker certification not claimed',
  usedInApp: meta.usedInApp,
})).sort((a,b) => Number(b.usedInApp)-Number(a.usedInApp) || a.text.localeCompare(b.text,'nl'));
const lines = missing.map(({usedInApp,...row}) => row);
const characters = lines.reduce((n,row) => n+row.text.length,0);
const report = {
  indexEntries: Object.keys(index.items).length,
  checkedUniqueTexts: all.size,
  missingUnique: lines.length,
  missingCurrentlyUsed: missing.filter(x=>x.usedInApp).length,
  characters,
  runtimeExampleMissing: !indexed.has('Mijn telefoon is leeg.'),
  limitation: 'Source/index match only; R2 files and spoken quality require separate checks',
};
const out = path.join(root, 'audio-export/unindexed-dutch');
fs.mkdirSync(out,{recursive:true});
const manifest = {
  version:1, language:'nl', approvedOnly:true,
  provenance:'Exact DutchTap authored practice-bank and variation source text; no automatic native-speaker certification',
  plannedCharacters:characters,
  batches:[{id:'nl-unindexed-20261102', items:lines}],
};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(out,'listen-list.txt'),lines.map((r,i)=>(i+1)+'. '+r.text).join('\n')+'\n');
console.log(JSON.stringify(report,null,2));
console.log('No credits spent. If this is not zero, recordings must be generated, uploaded to R2, then indexed.');
