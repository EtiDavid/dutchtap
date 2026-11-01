// DutchTap DUTCH-ONLY audio inventory and draft manifests capped at 28,000 V2 credits.
// Read-only: no network calls or paid text-to-speech generation.
async function dutchtapFullAudioAudit() {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { createHash } = await import('node:crypto');
  const { fileURLToPath } = await import('node:url');
  const { inventory } = await import('./export-learning-audio.mjs');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
  const hash = (text, lang) => createHash('sha256').update(`${lang}\0${text}`).digest('hex').slice(0, 24);
  const cap = 28000, maxItems = 1000;
  const out = path.join(root, 'audio-export/full-coverage');
  const collected = new Map();
  const stats = { sourceOccurrences: 0, intentionallyWrongSentencesExcluded: 0, excludedNonSpeechTemplates: 0, dataFilesRead: [] };
  function add(value, role, lang='nl', approved=false, audio='') {
    if (typeof value !== 'string' || !value.trim()) return;
    const text = value.trim();
    if (lang === 'en') return; // English text remains available; no English audio is planned.
    if (lang !== 'nl') throw Error('Unexpected language '+lang);
    stats.sourceOccurrences++;
    if (/…|\[\s*\.\.\.|\{\s*[^{}]+\s*\}/.test(text)) {stats.excludedNonSpeechTemplates++; return;}
    const id = hash(text,lang);
    const prev = collected.get(id);
    if (prev) {
      if (prev.text !== text || prev.lang !== lang) throw Error('Audio id collision: '+id);
      if (!prev.roles.includes(role)) prev.roles.push(role);
      prev.approved ||= approved;
      prev.existingAudio ||= audio;
    } else collected.set(id,{ id,lang,text,roles:[role],approved,existingAudio:audio });
  }
  for (const item of inventory()) {
    for(const role of item.roles) add(item.text,role,item.lang,item.approved,item.existingAudio);
  }
  function load(name){ stats.dataFilesRead.push(name); return read(name); }
  const everydayBank=load('dutch-practice-bank.json');
  for (const [key,bank] of Object.entries(everydayBank))
    for(const pair of bank.pairs||[]) add(pair[0],`everyday-drill:${key}`);
  const workplaceBank=load('workplace-practice-bank.json');
  for (const [key,bank] of Object.entries(workplaceBank))
    for(const e of bank.examples||[]) {
      add(e.text,`workplace-drill:${key}`);
      add(e.scenario,`workplace-situation:${key}`,'en');
    }
  for (const [parent,family] of Object.entries(load('dutch-variations.json')))
    for(const i of family.indices||[]) add(everydayBank[family.pattern]?.pairs?.[i]?.[0],`everyday-child:${parent}`);
  for (const [parent,family] of Object.entries(load('workplace-families.json')))
    for(const i of family.indices||[]) {
      const row=workplaceBank[family.group]?.examples?.[i];
      add(row?.text,`workplace-child:${parent}`);
      add(row?.scenario,`workplace-child-situation:${parent}`,'en');
    }
  for (const [parent,children] of Object.entries(load('grammar-variation-families.json')))
    for(const child of children) {
      add(child.text,`grammar-child:${parent}`);
      add(child.example?.text,`grammar-child-example:${parent}`);
      add(child.scenarioNl,`grammar-child-prompt:${parent}`);
      add(child.scenario,`grammar-child-situation:${parent}`,'en');
    }
  const analyses=fs.readdirSync(path.join(root,'data')).filter(n=>/^grammar-.*-analysis\.json$/.test(n)).sort();
  for(const filename of analyses) {
    const content=load(filename);
    for(const [id,record] of Object.entries(content.cards||{})){
      add(record.situationNl,`grammar-prompt:${id}`);
      add(record.situationEn,`grammar-situation:${id}`,'en');
      add(record.contrast?.dutch,`grammar-contrast:${id}`);
      for(const mistake of record.mistakes||[]) add(mistake.right,`grammar-correction:${id}`);
    }
  }
  for(const [topic,lesson] of Object.entries(load('grammar-topic-lessons.json'))){
    for(const section of lesson.sections||[]) for(const e of section.examples||[]) add(e.nl,`lesson-example:${topic}`);
    for(const correction of lesson.mistakes||[]) add(correction.right,`lesson-correction:${topic}`);
  }
  for(const file of ['grammar-notes.json','workplace-grammar-notes.json','grammar-pattern-notes.json'])
    for(const [card,note] of Object.entries(load(file)))
      for(const type of ['examples','originalExamples'])
        for(const example of note?.[type]||[]) add(example.dutch||example.nl||example.text,`note:${card}`);
  for(const row of load('editorial/grammar-als-expansion.json')) {
    add(row.dutch,'als-expanded');
    add(row.scenarioNl,'als-prompt');
    add(row.scenario,'als-situation','en');
  }
  for(const q of load('grammar-mixed-challenges.json').items||[]){
    add(q.situationNl,`mixed-grammar-prompt:${q.id}`);
    for(const option of q.options||[]) if(option.correct) add(option.text,`mixed-grammar-model:${q.id}`);
    else stats.intentionallyWrongSentencesExcluded++;
  }
  for(const v of load('learning-verbs.json')){
    add(v.lemma,`verb:${v.lemma}`);
    for(const [subject,form] of Object.entries(v.present||{})) add(`${subject} ${form}`,`verb-present:${v.lemma}`);
    if(v.past?.singular)add(`ik ${v.past.singular}`,`verb-past:${v.lemma}`);
    if(v.past?.plural)add(`wij ${v.past.plural}`,`verb-past:${v.lemma}`);
    if(v.perfect)add(`ik ${v.perfect}`,`verb-perfect:${v.lemma}`);
  }
  // On-screen correct grammar breakdown contrasts and corrected model sentences.
  for(const file of ['grammar-breakdowns.json','workplace-breakdowns.json'])
    for(const [id,breakdown] of Object.entries(load(file))) {
      add(breakdown.contrast?.dutch,`breakdown-contrast:${id}`);
      add(breakdown.mistake?.right,`breakdown-correction:${id}`);
      for(const mistake of breakdown.extraMistakes||[])add(mistake.right,`breakdown-correction:${id}`);
    }
  for(const [lemma,forms] of Object.entries(load('grammar-separable-forms.json')))
    for(const field of ['lemma','modal','teInfinitive','subordinate','subordinatePast','imperative'])
      add(forms[field],`separable-${field}:${lemma}`);
  for(const file of ['flashcards.json','flashcard-additions.json','flashcard-additions-2.json','workplace-cards.json','grammar-pattern-cards.json'])
    for(const card of load(file)){
      add(card.scenarioNl,`card-prompt:${card.id}`);
      add(card.scenario,`card-situation:${card.id}`,'en');
    }
  add('Goedendag, hoe gaat het met u?','voice-picker-nl');
  const existing=load('audio-index.json').items;
  let missingIndexedFiles=0,badIndexedIds=0, missingLegacyFiles=0;
  for(const [id,entry] of Object.entries(existing)){
    if(entry.lang!=='nl' || hash(entry.text,entry.lang)!==id)badIndexedIds++;
    if(!fs.existsSync(path.join(root,'public',entry.path.replace(/^\//,''))))missingIndexedFiles++;
  }
  if(missingIndexedFiles||badIndexedIds)throw Error(`Indexed audio invalid: ${missingIndexedFiles} missing files, ${badIndexedIds} bad IDs.`);
  for(const item of collected.values()) {
    const indexed=existing[item.id];
    if(indexed && indexed.lang===item.lang && indexed.text===item.text &&
      fs.existsSync(path.join(root,'public',indexed.path.replace(/^\//,''))))item.existingAudio=indexed.path;
    else if(item.existingAudio && !fs.existsSync(path.join(root,'public',item.existingAudio.replace(/^\//,'')))){
      missingLegacyFiles++; item.existingAudio='';
    }
  }
  const all=[...collected.values()];
  const pending=all.filter(x=>!x.existingAudio);
  const isWord=x=>x.roles.some(r=>/^(word:|plural:|game-|verb|separable)/.test(r));
  const summarise=list=>({
    uniqueUtterances:list.length,
    characters:list.reduce((n,x)=>n+x.text.length,0),
    wordsAndConjugations:list.filter(isWord).length,
    sentencesAndPrompts:list.filter(x=>!isWord(x)).length,
    pendingEditorialReview:list.filter(x=>!x.approved).length
  });
  const report={
    campaign:'full-coverage',
    sourceCommit:'5a207a0 plus later audit-only changes',
    scope:'Dutch-only audio targets: cards, variations, model answers, vocabulary, game word forms, lesson examples, spoken Dutch prompts, grammar corrections and drills. English remains text-only in this campaign; French untouched. Not all explanatory prose is a recording target.',
    indexedAudioFiles:Object.keys(existing).length,
    stats:{...stats,analysisFiles:analyses.length,missingLegacyFiles},
    languages:{},
    excludedLanguages:['en','fr'],
    billingNote:'ElevenLabs eleven_multilingual_v2 subscription pricing: 1 input character = 1 credit; actual account balance and current billing must still be checked before generation.',
    maxBatchCredits:cap,
    maxBatchUtterances:maxItems,
    warning:'Generation and approval are NOT performed by this script. Final audit must confirm every Dutch Listen path uses recorded audio without device-TTS fallback. English and French playback are out of scope.'
  };
  fs.mkdirSync(out,{recursive:true});
  const tsv=list=>['lang\ttext\tcharacters\troles\tapproved\tid',
    ...list.map(x=>[x.lang,x.text.replace(/[\n\t]/g,' '),x.text.length,x.roles.join(','),x.approved,x.id].join('\t'))].join('\n')+'\n';
  // Remove stale English planning files from any earlier run of this planner.
  fs.rmSync(path.join(out, 'missing-en.tsv'), { force: true });
  fs.rmSync(path.join(out, 'en'), { recursive: true, force: true });
  for(const lang of ['nl']){
    const everything=all.filter(x=>x.lang===lang), notYet=pending.filter(x=>x.lang===lang);
    const sorted=notYet.sort((a,b)=>a.text.localeCompare(b.text,lang));
    report.languages[lang]={
      total:summarise(everything),
      recorded:summarise(everything.filter(x=>x.existingAudio)),
      missing:summarise(sorted)
    };
    fs.writeFileSync(path.join(out,`missing-${lang}.tsv`),tsv(sorted));
    const folder=path.join(out,lang);fs.mkdirSync(folder,{recursive:true});
    const chunks=[];let chunk=[],creditChars=0;
    for(const item of sorted){
      if(item.text.length>cap)throw Error('Single utterance exceeds 28k characters: '+item.id);
      if(chunk.length&&(chunk.length>=maxItems||creditChars+item.text.length>cap)){
        chunks.push(chunk);chunk=[];creditChars=0;
      }
      chunk.push(item);creditChars+=item.text.length;
    }
    if(chunk.length)chunks.push(chunk);
    report.languages[lang].batches=chunks.length;
    chunks.forEach((items,i)=>{
      const n=String(i+1).padStart(3,'0'),credits=items.reduce((n,x)=>n+x.text.length,0);
      const manifest={version:1,campaign:'full-coverage',language:lang,
        approvedOnly:items.every(x=>x.approved),plannedCreditCharacters:credits,
        batches:[{id:`${lang}-full-${n}`,items}]};
      fs.writeFileSync(path.join(folder,`batch-${n}.json`),JSON.stringify(manifest,null,2)+'\n');
      fs.writeFileSync(path.join(folder,`batch-${n}.tsv`),tsv(items));
    });
  }
  fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  console.log('No API calls, paid generation, or source changes were performed.');
}
await dutchtapFullAudioAudit();
