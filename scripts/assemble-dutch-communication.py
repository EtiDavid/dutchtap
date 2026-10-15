"""Assemble authored situations and reviewed Dutch models; no runtime translation.

The two TSV situation files are editorial inputs. Alternative answers come from
explicit authored rows and conservative, grammar-scoped transformations below.
The emitted model inventory is reviewed and versioned, rather than generated in
response to a learner's answer. Stable hashes identify exact alternate texts.
"""
import hashlib,json,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/'data'/name).read_text())
def rows(name):return [line.split('\t') for line in (ROOT/'data'/'editorial'/name).read_text().splitlines() if line.strip()]
main=sum([read(n) for n in ['flashcards.json','flashcard-additions.json','flashcard-additions-2.json']],[])
scenarios=dict(rows('dutch-main-scenarios.tsv'));example_scenarios=dict(rows('dutch-example-scenarios.tsv'))
bank=read('dutch-practice-bank.json');breakdowns=read('grammar-breakdowns.json')
assert set(scenarios)=={c['id'] for c in main}
tasks={};parts={}
for c in main:
 b=breakdowns[c['id']]
 tasks[c['dutch']]={'scenario':scenarios[c['id']],'answers':[{'id':'model','text':c['dutch'],'english':c['english'],'explanation':b['order']+' '+b['forms']}]}
 parts[c['dutch']]=b['parts']
for key,family in bank.items():
 for i,(text,english) in enumerate(family['pairs']):
  if text not in tasks:
   scenario=example_scenarios[f'{key}:{i}']
   tasks[text]={'scenario':scenario,'answers':[{'id':'model','text':text,'english':english,'explanation':family['hint']}]}

def norm(t):return re.sub(r'[^\w\s]','',t.casefold()).split()
def add(base,text,english,note):
 assert base in tasks,base
 if any(norm(a['text'])==norm(text) for a in tasks[base]['answers']):return
 tasks[base]['answers'].append({'id':'alt-'+hashlib.sha256(text.encode()).hexdigest()[:12],'text':text,'english':english,'explanation':note})
for row in rows('dutch-answer-alternatives.tsv'):
 assert len(row)==4,row
 add(*row)

# Full/unstressed subject forms preserve referents and verb agreement.
subject_forms={'we':'wij','wij':'we','ze':'zij','zij':'ze','je':'jij','jij':'je'}
for base,task in tasks.items():
 primary=task['answers'][0]
 subject=next((p['text'] for p in parts.get(base,[]) if p['label']=='subject'),None)
 if subject and subject.casefold() in subject_forms:
  old=subject;new=subject_forms[old.casefold()]
  m=re.search(r'\b'+re.escape(old)+r'\b',base,re.I)
  if m:
   replacement=new.capitalize() if m.start()==0 else new
   text=base[:m.start()]+replacement+base[m.end():]
   add(base,text,primary['english'],f"{new.capitalize()} and {old.lower()} refer to the same subject. The full form can emphasise who acts; the unstressed form is common in ordinary speech. Subject and verb agreement remain the same.")
 elif not parts.get(base):
  m=re.match(r'^(Wij|We|Zij|Ze)\b',base)
  if m:
   new=subject_forms[m[0].lower()].capitalize()
   add(base,new+base[m.end():],primary['english'],f"{new} is the other full/unstressed form of subject {m[0].lower()}. Both refer to the same person or group; full forms can carry emphasis. Keep the same finite verb.")
 # These specific inflection alternatives are standard and do not turn a question into a different speech act.
 for old,new,note in [
  ('Kun je ','Kan je ','Kun je and kan je are both standard forms of kunnen with subject je. The action still follows as an infinitive.'),
  ('Kunt u ','Kan u ','Kunt u and kan u are both standard; kan u is particularly common in Belgium. U keeps polite address and the action remains an infinitive.'),
  ('Heeft u ','Hebt u ','Heeft u and hebt u are both standard with polite subject u. This is not the informal heb je inversion pattern.'),
  ('Hebt u ','Heeft u ','Hebt u and heeft u are both standard forms of hebben with polite subject u.'),
  ('Zul je ','Zal je ','Zul je and zal je are both standard with subject je. Neither form takes an additional -t before following subject je.'),
  ('Zal je ','Zul je ','Zal je and zul je are both standard with following subject je. Keep the other verb an infinitive.'),
  ('Ik hou ','Ik houd ','Ik hou and ik houd are both standard first-person present forms of houden. The fixed preposition van remains with the thing enjoyed.'),
  ('Ik houd ','Ik hou ','Ik houd and ik hou are both standard. Only the optional final d of the first-person form changes.'),
 ]:
  if base.startswith(old):add(base,new+base[len(old):],primary['english'],note)

# Publish reviewed V2 alternatives from complete labelled main clauses only.
# No inflection is invented: informal second-person subjects are excluded.
LOWER={'ik','we','wij','zij','ze','hij','het','de','een','ons','onze','mijn','zijn','haar','dit','dat','deze','die','jullie'}
def mid(text):return text[0].lower()+text[1:] if text.split()[0].casefold() in LOWER else text
V2_REVIEWED=set(read('editorial/dutch-v2-reviewed.json'))
for base,ps in parts.items():
 if base not in V2_REVIEWED:continue
 if base.endswith('?') or ',' in base or re.search(r'\b(omdat|dat|als|toen|terwijl|voordat|nadat|zodra|totdat|of)\b',base,re.I):continue
 if any('clause' in p['label'] or p['label']=='conjunction' for p in ps):continue
 if norm(' '.join(p['text'] for p in ps))!=norm(base):continue
 subject=next((i for i,p in enumerate(ps) if p['label']=='subject'),None)
 finite=next((i for i,p in enumerate(ps) if 'finite verb' in p['label']),None)
 time=next((i for i,p in enumerate(ps) if p['label'] in ['time phrase','time expression']),None)
 if subject is None or finite is None or time is None or ps[subject]['text'].casefold() in ['je','jij']:continue
 if subject==0 and finite==1 and time>1:
  order=[time,finite,subject]+[i for i in range(len(ps)) if i not in [time,finite,subject]]
 elif time==0 and finite==1 and subject==2:
  order=[subject,finite,time]+[i for i in range(len(ps)) if i not in [time,finite,subject]]
 else:continue
 words=[mid(ps[i]['text']) for i in order];text=' '.join(words);text=text[0].upper()+text[1:]+'.'
 add(base,text,tasks[base]['answers'][0]['english'],'The time phrase and subject exchange main-clause positions around the finite verb. One whole constituent is first, the finite verb is second, and the subject follows it if time is first. The event and time are unchanged.')

# Closed, reviewable alternatives for request/suggestion forms and common synonyms.
for base,task in tasks.items():
 primary=task['answers'][0];english=primary['english']
 for old,new,subject in [('Kunt u ','Zou u ','u'),('Kun je ','Zou je ','je')]:
  if base.startswith(old) and base.endswith('?'):
   words=base[len(old):-1].split()
   if words[-1].endswith('en'):
    text=new+' '.join(words[:-1]+['kunnen',words[-1]])+'?'
    meaning=re.sub(r'^Can you ', 'Could you ',english)
    add(base,text,meaning,'Zou '+subject+' ... kunnen + infinitive phrases the same request more tentatively/politely. Kunnen is an infinitive after zou; the action also remains an infinitive. This is a present polite request, not a report about a past ability.')
 if base.startswith('Laten we ') and english.startswith("Let's "):
  text='Zullen we '+base[len('Laten we '):].rstrip('.!?')+'?'
  add(base,text,'Shall we '+english[len("Let's "):].rstrip('.!?')+'?','Zullen we + infinitive offers the shared activity as a question. Laten we introduces it as a let’s-suggestion. Both fit proposing this joint activity; neither reports a completed event.')
 if base.startswith('Zullen we ') and english.startswith('Shall we '):
  text='Laten we '+base[len('Zullen we '):].rstrip('.!?')+'.'
  add(base,text,"Let's "+english[len('Shall we '):].rstrip('.!?')+'.','Laten we + infinitive makes the shared suggestion directly. Zullen we asks it as a proposal. Both fit this invitation to do the activity together.')
 m=re.search(r'\b(erg|heel) (?=(koud|mistig|wazig|vies|lang|trots|blij|gemakkelijk|moeilijk|duidelijk|riskant|vermoeid|druk|veilig|kort|hard|belangrijk)\b)',base)
 if m:
  other='heel' if m[1]=='erg' else 'erg'
  add(base,base[:m.start()]+other+base[m.end(1):],english,'Heel and erg both mean very as degree adverbs before this adjective/adverb. This changes the wording, not the stated degree or who the sentence describes.')
 for old,new,note in [('makkelijk','gemakkelijk','Makkelijk and gemakkelijk both mean easy here. Both are predicate adjectives and have no attributive -e in this construction.'),('gemakkelijk','makkelijk','Gemakkelijk and makkelijk are synonymous here; makkelijk is especially common in conversation. Neither changes the action described.'),('jouw','je','Jouw and possessive je both mean your here. Jouw is the full form and can emphasise ownership; je is unstressed. This je is not the subject.'),('mij','me','Me is the unstressed object form corresponding to full mij. The receiver or other object remains the same; the original full form can carry emphasis.'),('jou','je','Je is the unstressed object form corresponding to full jou in this position. It still refers to the person addressed; it is not a new subject or possessive here.')]:
  if re.search(r'\b'+old+r'\b',base):add(base,re.sub(r'\b'+old+r'\b',new,base,count=1),english,note)

for base,task in tasks.items():
 assert 1<=len(task['answers'])<=30,base
 assert 8<=len(task['scenario'].split())<=80,(base,task['scenario'])
 assert task['answers'][0]['text']==base
 for a in task['answers']:assert a['english'] and len(a['explanation'])>15
out=ROOT/'data'/'dutch-communication.json';out.write_text(json.dumps(tasks,ensure_ascii=False,indent=1)+'\n')
summary={'mainCards':len(main),'distinctSentenceTasks':len(tasks),'familyEntries':6000,'answerModels':sum(len(t['answers']) for t in tasks.values()),'multipleModels':sum(len(t['answers'])>1 for t in tasks.values()),'maxModels':max(len(t['answers']) for t in tasks.values())}
print(json.dumps(summary))
