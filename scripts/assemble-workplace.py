"""Assemble explicitly authored Dutch at Work data, without translating or conjugating.
Rows contain literal sentence parts, English situations, selected verb lemmas and editorial notes.
Practice families reuse a reviewed thematic library; distinct counts are reported honestly.
"""
from pathlib import Path
import json,re,hashlib,collections,difflib
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'data/editorial/workplace';OUT=ROOT/'data'
AREAS={'office':'Office conversation and introductions','clarification':'Help, clarification and repetition','support':'User support and support requests','problems':'Problems and their impact','troubleshooting':'Troubleshooting and explaining steps','meetings':'Meetings and progress updates','priorities':'Tasks, priorities and deadlines','changes':'Changes, testing, access and permission','incidents':'Incidents, escalation and handovers','remote':'Email, chat and remote collaboration'}
ROLES={'S':'subject','V':'finite verb','AUX':'finite verb (auxiliary)','MOD':'finite verb (modal)','PAST':'finite verb (past)','PAUX':'finite verb (past auxiliary)','O':'object','IO':'indirect object','PP':'preposition phrase','T':'time phrase','L':'place phrase','I':'infinitive','TE':'infinitive (te phrase)','PT':'past participle','PART':'separable particle','G':'subordinate clause','Q':'question word','C':'complement','A':'adverb','NEG':'negation','R':'reflexive pronoun','IM':'imperative verb','CONJ':'conjunction','F':'fixed phrase','DIR':'direction'}
verbs=json.loads((E/'verbs.json').read_text());patterns=json.loads((E/'patterns.json').read_text())
def load_rows(path):
 return [json.loads(line) for line in path.read_text().splitlines() if line.strip() and not line.startswith('#')]
def norm(s):return re.sub(r'[^\w]+',' ',s.lower()).strip()
def write(name,data):
 (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def construct(row):
 group,pattern,spec,en,scenario,lemmas,note,*rest=row
 assert pattern in patterns,(pattern,spec)
 parts=[{'label':ROLES[k],'text':text} for k,text in (segment.split('=',1) for segment in spec.split('|'))]
 text=' '.join(p['text'] for p in parts);assert text[-1] in '.?!',text
 assert len(text.split())<=40 and len(parts)>=2,text
 assert en and len(scenario.split())>=12 and note and not re.search(r'TODO|FIXME|\?\?\?',str(row)),text
 keys=lemmas.split(',');lex=[(key,verbs[key]) for key in keys]
 finite=next((p for p in parts if p['label'].startswith('finite verb') or p['label']=='imperative verb'),None);assert finite,text
 formtext=' '.join(f'{key}: present forms {v[0]} / {v[1]} / {v[2]}; past singular {v[3]}, plural {v[4]}; perfect {v[5] or "not used as a standalone form here"}. {v[6]}' for key,v in lex)
 title,rule,compare=patterns[pattern]
 first=parts[0]['text'];subject=next((p['text'] for p in parts if p['label']=='subject'),None)
 if pattern=='imperative':order=(f'The instruction starts with {finite["text"]}; the addressed person is understood. ' if parts[0] is finite else f'After the introductory phrase {first}, the instruction uses {finite["text"]} with the addressed person understood. ')+rule
 elif pattern in ['yes-no','modal-question','polite']:order=f'The finite verb {finite["text"]} comes before subject {subject or "the addressed person"}. '+rule
 elif pattern in ['question','past-question']:order=f'The first question constituent is {first}; {finite["text"]} is the finite verb. '+rule
 else:order=f'The first constituent is {first}; {finite["text"]} is a finite main verb'+(f' and {subject} is its subject.' if subject else '.')+' In a declarative main clause, the finite verb is second in constituents, not necessarily second in individual words. '+rule
 detail=note+' '+formtext
 lemma,v=lex[0];original=finite['text'];bare=original.strip('.,?!;:').lower();old=original.strip('.,?!;:')
 # Only incorrect finite agreement is assembled. All replacement forms are explicitly supplied, never conjugated.
 if pattern=='imperative':wrong='Wij '+text[0].lower()+text[1:];why='This situation calls for an instruction. Do not add subject Wij to a singular imperative stem; a statement with wij would need a plural finite form.'
 else:
  past=finite['label'] in ['finite verb (past)','finite verb (past auxiliary)']
  replacement=(v[4] if bare==v[3] else v[3]) if past else (lemma if bare!=lemma else v[0])
  # For separable finite verbs, the lexicon's first word is the finite piece.
  replacement=replacement.split()[0]
  if replacement.lower()==bare:replacement='zijn' if bare!='zijn' else 'is'
  new=replacement.capitalize() if old[0].isupper() else replacement
  wrongparts=[{**p,'text':p['text'].replace(old,new,1)} if p is finite else p for p in parts]
  wrong=' '.join(p['text'] for p in wrongparts)
  why=f'The stated subject and tense require the finite form {old} here. {replacement} is not the matching finite form for this sentence; an infinitive is not automatically a finite verb.'
 mistake={'wrong':wrong,'right':text,'why':why}
 if subject and subject.lower() in ['ze','zij']:
  mistake.update(alternative=True,why='Compare the intended person and number in this situation. Ze/zij can mean she or they in other contexts; the published verb form matches the person and tense required here.')
 explanation=f'{title}. {order} {note}'
 answers=[{'id':'model','text':text,'english':en,'explanation':explanation}]
 for alt in (rest[0] if rest else []):
  assert len(alt)==3 and all(alt),alt
  answers.append({'id':'a-'+hashlib.sha256(alt[0].encode()).hexdigest()[:12],'text':alt[0],'english':alt[1],'explanation':alt[2]})
 return dict(group=group,pattern=pattern,text=text,english=en,scenario=scenario,parts=parts,order=order,forms=detail,compare=compare,mistake=mistake,explanation=explanation,answers=answers,lemmas=keys,note=note)
existing=[]
for name in ['flashcards.json','flashcard-additions.json','flashcard-additions-2.json']:
 existing += [x['dutch'] for x in json.loads((OUT/name).read_text())]
for x in json.loads((OUT/'dutch-communication.json').read_text()).values():existing += [a['text'] for a in x['answers']]
for x in json.loads((OUT/'grammar-notes.json').read_text()).values():
 existing += [e['dutch'] for k in ['examples','originalExamples'] for e in x.get(k,[])]
protected=set(map(norm,existing));seen=set(protected);cards=[];notes={};breakdowns={};tasks={};families={};bank={};coverage=[];authored_by_id={}
for path in sorted(E.glob('children-*.jsonl')):
 area=path.stem.removeprefix('children-');assert area in AREAS
 for row in load_rows(path):
  c=construct(row);key=area+'-'+c['group'];assert norm(c['text']) not in protected,'Child duplicates published content: '+c['text']
  assert norm(c['text']) not in seen,'Repeated authored child: '+c['text'];seen.add(norm(c['text']))
  bank.setdefault(key,{'focus':c['group'],'examples':[]})['examples'].append({k:c[k] for k in ['text','english','scenario','explanation']})
  tasks[c['text']]={'scenario':c['scenario'],'answers':c['answers']}
for path in sorted(E.glob('parents-*.jsonl')):
 area=path.stem.removeprefix('parents-');assert area in AREAS
 rows=load_rows(path);counts=collections.Counter()
 for i,row in enumerate(rows,1):
  c=construct(row);assert norm(c['text']) not in seen,'Parent duplicates published/child/new content: '+c['text'];seen.add(norm(c['text']));id=f'career-{area}-{i:03d}';authored_by_id[id]=c;key=area+'-'+c['group'];pool=bank.get(key,{}).get('examples',[]);assert len(pool)>=12,(key,'needs 12 reviewed child sentences')
  offset=counts[key];counts[key]+=1;indices=[(offset+j)%len(pool) for j in range(10)];examples=[pool[j] for j in indices]
  cards.append(dict(id=id,category=area,collection='workplace',dutch=c['text'],english=c['english'],scenario=c['scenario'],cue=c['scenario'],grammar=c['explanation'],variation=c['answers'][1]['text'] if len(c['answers'])>1 else examples[0]['text'],image='',audio='',imageStatus='not-applicable',audioStatus='device',difficulty='beginner' if i<=20 else 'intermediate',vocabularyIds=[],review={'status':'ai-editorially-reviewed','independentHumanReview':False,'batch':area,'focus':c['pattern']}))
  notes[id]={'rule':c['explanation'],'examples':[{'dutch':x['text'],'english':x['english']} for x in examples]}
  breakdowns[id]={k:c[k] for k in ['parts','order','forms','compare','mistake']};breakdowns[id]['meaning']=c['english']+' '+c['scenario']
  tasks[c['text']]={'scenario':c['scenario'],'answers':c['answers']};families[id]={'group':key,'indices':indices};coverage.append({'id':id,'area':area,'situation':c['group'],'pattern':c['pattern'],'verbs':c['lemmas'],'review':'AI editorial review of literal authored row; no independent native certification'})
# Vocabulary linking is exact written-form matching using a reviewed lexicon, not unrestricted stemming.
vocabpath=E/'vocabulary.json';vocab=json.loads(vocabpath.read_text()) if vocabpath.exists() else []
oldvocab=json.loads((OUT/'vocabulary.json').read_text());newvocab=[];updates=[]
for entry in vocab:
 forms=entry['forms'];occ=[]
 for card in cards:
  if entry.get('lemma') and entry['lemma'] not in authored_by_id[card['id']]['lemmas']:continue
  form=next((f for f in forms if re.search(r'(?<!\w)'+re.escape(f)+r'(?!\w)',card['dutch'],re.I)),None)
  if form:occ.append({'cardId':card['id'],'form':form})
 if not occ:continue
 matches=[v for v in oldvocab if v['headword']==entry['headword']]
 if entry.get('newSense'):matches=[]
 if entry.get('existingId'):matches=[v for v in oldvocab if v['id']==entry['existingId']];assert len(matches)==1
 assert len(matches)<=1,'Choose a reviewed sense explicitly: '+entry['headword']
 vid=matches[0]['id'] if matches else entry.get('id','career-'+re.sub(r'[^\w]+','-',entry['headword'].lower()).strip('-'))
 if matches:updates.append({'id':vid,'occurrencesToAppend':occ})
 else:newvocab.append({k:entry[k] for k in ['headword','english','explanation','type','article','plural','details']}|{'id':vid,'occurrences':occ})
 for o in occ:next(c for c in cards if c['id']==o['cardId'])['vocabularyIds'].append(vid)
for name,data in [('workplace-cards.json',cards),('workplace-grammar-notes.json',notes),('workplace-breakdowns.json',breakdowns),('workplace-communication.json',tasks),('workplace-families.json',families),('workplace-practice-bank.json',bank),('workplace-vocabulary.json',newvocab),('workplace-vocabulary-links.json',updates)]:write(name,data)
counts=collections.Counter(c['category'] for c in cards);child_entries=10*len(families);distinct_children=len({norm(x['text']) for g in bank.values() for x in g['examples']});report={'base':'1f353b78e6db247011ed383d4544c1d6a5c84761','mainCards':len(cards),'byArea':dict(counts),'childEntries':child_entries,'distinctChildSentences':distinct_children,'modelAnswers':sum(len(t['answers']) for t in tasks.values()),'distinctTasks':len(tasks),'vocabularyAdditions':len(newvocab),'vocabularyLinkUpdates':len(updates),'mainCardsWithoutVocabulary':[c['id'] for c in cards if not c['vocabularyIds']],'patternCounts':dict(collections.Counter(x['pattern'] for x in coverage)),'complete':len(cards)==600 and all(counts[a]==60 for a in AREAS),'review':'AI editorial review; no independent human/native certification'}
(ROOT/'docs/workplace/content-counts.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(ROOT/'docs/workplace/grammar-coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
