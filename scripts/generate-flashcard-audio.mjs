// Node 20.12+; no dependencies. Credentials are loaded only in this local process.
import { loadEnvFile } from 'node:process';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const name of ['.env', '.env.local']) { try { loadEnvFile(path.join(root,name)); } catch (e) { if(e.code!=='ENOENT') throw e; } }
const args = new Set(process.argv.slice(2));
const cards = JSON.parse(await readFile(path.join(root,'data/flashcards.json'),'utf8'));
const testSentences = [
  'Ik ben vandaag aan het werk.',
  'Kun je me even helpen?',
  'Ik heb de server opnieuw opgestart.',
  'Als ik klaar ben, stuur ik je een bericht.',
  'Ik weet niet of dit een waarschuwing of een fout is.',
].map((dutch, i) => ({id:`api-test-${String(i+1).padStart(2,'0')}`,dutch}));
const testMode = args.has('--test-five');
const voice = process.env.ELEVENLABS_VOICE_ID;
const model = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const key = process.env.ELEVENLABS_API_KEY;
const output = path.join(root,testMode?'audio-test-output':'public/audio/flashcards');
async function main() {
  if(args.has('--dry-run')) {
    console.log(`${testMode?testSentences.length:args.has('--all')?cards.length:3} clips; ${model}; no API calls.\n${(testMode?testSentences:args.has('--all')?cards:[cards[0],cards[10],cards[20]]).map(c=>`${c.id}: ${c.dutch}`).join('\n')}`); return;
  }
  if(!key) throw new Error('Set ELEVENLABS_API_KEY in .env or .env.local.');
  if(args.has('--voices')) {
    const response = await fetch('https://api.elevenlabs.io/v1/voices',{headers:{'xi-api-key':key},signal:AbortSignal.timeout(30000)});
    if(!response.ok) throw new Error(`Voice listing failed (HTTP ${response.status}). Check key permissions.`);
    const data = await response.json();
    for(const v of data.voices) console.log(`${v.voice_id} | ${v.name} | ${JSON.stringify(v.labels || {})}`);
    return;
  }
  if(!voice || !/^[a-zA-Z0-9_-]+$/.test(voice)) throw new Error('Set ELEVENLABS_VOICE_ID in .env or .env.local. Run npm run audio:voices to list your voices.');
  await mkdir(output,{recursive:true});
  const manifestPath = path.join(output,'manifest.json');
  let manifest = {};
  try { manifest = JSON.parse(await readFile(manifestPath,'utf8')); } catch(e) { if(e.code!=='ENOENT') throw e; }
  const selected = testMode ? testSentences : args.has('--all') ? cards : [cards[0],cards[10],cards[20]];
  console.log(`Generating up to ${selected.length} clips. This uses ElevenLabs credits. Existing matching files are skipped.`);
  const maxChars = Number(process.env.ELEVENLABS_TEST_MAX_CHARACTERS || 250);
  if (testMode && selected.reduce((sum,card)=>sum+card.dutch.length,0)>maxChars) throw new Error('Five-clip test exceeds configured character safety cap.');
  for(const card of selected) {
    const body = {text:card.dutch,model_id:model,voice_settings:{stability:0.65,similarity_boost:0.75,speed:0.9}};
    const hash = createHash('sha256').update(JSON.stringify({voice,body})).digest('hex');
    const target = path.join(output,`${card.id}.mp3`);
    let existing;
    try { existing = await readFile(target); } catch(e) { if(e.code!=='ENOENT') throw e; }
    if(existing?.length && manifest[card.id]?.hash===hash && manifest[card.id]?.audioHash===createHash('sha256').update(existing).digest('hex')) { console.log(`Skip ${card.id}`); continue; }
    if(existing?.length && !args.has('--replace')) throw new Error(`${card.id} already exists with different or unknown settings. Use --replace intentionally to regenerate.`);
    // No automatic POST retries: a timeout could still have consumed credits.
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json',Accept:'audio/mpeg'},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
    if(!response.ok) throw new Error(`Generation stopped at ${card.id} (HTTP ${response.status}). Check permissions, credits, voice and model. Completed clips are preserved.`);
    if(!response.headers.get('content-type')?.includes('audio/')) throw new Error(`Unexpected response type for ${card.id}.`);
    const audio = Buffer.from(await response.arrayBuffer());
    if(audio.length<100) throw new Error(`Empty audio for ${card.id}`);
    await writeFile(`${target}.part`,audio); await rename(`${target}.part`,target);
    manifest[card.id] = {hash,audioHash:createHash('sha256').update(audio).digest('hex'),voice,model,text:card.dutch,generatedAt:new Date().toISOString()};
    await writeFile(`${manifestPath}.part`,JSON.stringify(manifest,null,2)+'\n'); await rename(`${manifestPath}.part`,manifestPath);
    console.log(`Saved ${card.id}.mp3`);
  }
}
main().catch(e=>{ console.error(e.message); process.exitCode=1; });
