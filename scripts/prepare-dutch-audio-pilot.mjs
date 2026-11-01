// One-recording-per-exact-Dutch-utterance smoke test before the full ElevenLabs campaign.
// AI-reviewed examples from DutchTap's existing grammar lessons. Not independent native review.
// No paid API calls. Writes only a local, gitignored manifest.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
const lessons = read('grammar-topic-lessons.json');
const existing = read('audio-index.json').items;
const pilot = {
  als: 'Als ik tijd heb, help ik je.',
  separable: 'Ik bel mijn collega terug.',
  inversion: 'Om negen uur begint de vergadering.',
  omdat: 'Ik leer Nederlands omdat ik in België woon.',
  dat: 'Ik denk dat hij thuis is.',
  toen: 'Toen de storing begon, belde ik de helpdesk.',
  tot: 'Ik wacht tot de bus komt.',
  verbs: 'Ik hoef morgen niet te werken.',
  tense: 'Vanochtend heb ik drie vergaderingen gehad.',
  wanneer: 'Wanneer vertrekt de bus?',
  terwijl: 'Terwijl de printer afdrukt, beantwoord ik mijn e-mails.',
  voordat: 'We maken een back-up voordat we de update installeren.',
  nadat: 'Nadat we de back-up hebben gemaakt, starten we de update.',
  zodra: 'Zodra de vergadering voorbij is, stuur ik de notulen.',
  of: 'We onderzoeken of het probleem opnieuw optreedt.',
  hoewel: 'Hoewel ik moe ben, blijf ik tot het einde.',
  indirect: 'Ik weet niet waar hij woont.',
  relative: 'Het huis dat te koop staat, heeft een grote tuin.',
  connectors: 'Ik spreek langzaam zodat iedereen me kan verstaan.',
  exceptions: 'Ondanks het slechte weer gingen we naar buiten.',
  daar: 'Zoals je weet, begint de vergadering om negen uur.'
};
const items = [];
const skippedRecorded = [];
for(const [topic,text] of Object.entries(pilot)){
  const inLesson = (lessons[topic]?.sections ?? []).some(section =>
    (section.examples ?? []).some(example => example.nl === text));
  if(!inLesson)throw Error('Pilot text no longer matches an authored lesson: '+topic);
  const id=createHash('sha256').update('nl\0'+text).digest('hex').slice(0,24);
  if(existing[id]){skippedRecorded.push(topic);continue;}
  items.push({id,lang:'nl',text,roles:['grammar-lesson:'+topic],
    approved:true,existingAudio:'',review:'AI-reviewed for pilot; independent native-speaker review not performed'});
}
if(!items.length)throw Error('Pilot already recorded; no new clips needed.');
const out=path.join(root,'audio-export','pilot-001');
fs.mkdirSync(out,{recursive:true});
const manifest={
  version:1,
  language:'nl',
  approvedOnly:true,
  review:'AI-prechecked pilot of exact authored lesson examples; no independent native-speaker certification',
  batches:[{id:'nl-pilot-001',items}]
};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(out,'listen-list.txt'),
  items.map((row,i)=>`${i+1}. ${row.text}`).join('\n')+'\n');
console.log(JSON.stringify({language:'nl',clipsToRecord:items.length,
  estimatedCharacters:items.reduce((n,x)=>n+x.text.length,0),
  recordedAlreadySkipped:skippedRecorded,
  manifest:'audio-export/pilot-001/manifest.json',
  list:'audio-export/pilot-001/listen-list.txt',
  noPaidApiRequests:true},null,2));
