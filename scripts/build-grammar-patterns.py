#!/usr/bin/env python3
"""Builds the Grammar patterns collection: sentences for every learning topic, as ordinary flashcards.

Sources: data/learning-tasks.json (the 110 original lab tasks) and data/editorial/grammar-pattern-extra.tsv (84 more for the six structure
patterns). Output: data/grammar-pattern-cards.json and data/grammar-pattern-notes.json. Run: python3 scripts/build-grammar-patterns.py
"""
import collections, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
J = lambda p: json.loads((ROOT / p).read_text())
topics = {t['id']: t for t in J('data/learning-topics.json')}
rows = collections.OrderedDict((t, []) for t in topics)
for task in J('data/learning-tasks.json'):
    rows[task['topic']].append({'dutch': task['answers'][0], 'english': task['english'], 'scenario': task['promptEnglish'], 'why': task['explanation'], 'tense': task['tense']})
for line in (ROOT / 'data/editorial/grammar-pattern-extra.tsv').read_text(encoding='utf-8').splitlines():
    topic, dutch, english, scenario, why = line.split('\t')
    rows[topic].append({'dutch': dutch, 'english': english, 'scenario': scenario, 'why': why, 'tense': 'present'})
EASY = {'inversion', 'omdat', 'dat', 'als'}
cards, notes, seen = [], {}, set()
for topic in rows:
    unique, keys = [], set()
    for item in rows[topic]:
        if item['dutch'].lower() not in keys: keys.add(item['dutch'].lower()); unique.append(item)
    rows[topic] = unique
for topic, items in rows.items():
    for i, item in enumerate(items):
        key = item['dutch'].lower()
        if key in seen: continue  # the same sentence appears once per collection
        seen.add(key)
        cid = f'pat-{topic}-{i + 1:02d}'
        sibling = items[(i + 1) % len(items)]
        others = [items[(i + k) % len(items)] for k in range(2, min(12, len(items)))]  # the next sentence is the variation, so it is not repeated as an example
        cards.append({
            'id': cid, 'category': topic, 'collection': 'grammar', 'dutch': item['dutch'], 'english': item['english'],
            'scenario': item['scenario'], 'cue': item['scenario'], 'grammar': item['why'], 'variation': sibling['dutch'],
            'image': '', 'audio': '', 'quizMode': 'order', 'imageStatus': 'not-applicable', 'audioStatus': 'device',
            'difficulty': 'beginner' if topic in EASY or item['tense'] == 'present' else 'intermediate', 'vocabularyIds': [],
            'review': {'status': 'ai-editorially-reviewed', 'independentHumanReview': False, 'batch': 'grammar-patterns', 'focus': topic},
        })
        notes[cid] = {'rule': f"{item['why']} Pattern: {topics[topic]['rule']}", 'examples': [{'dutch': o['dutch'], 'english': o['english']} for o in others]}
# Add reviewed expansion after all legacy grammar cards, preserving original IDs and order.
# The canonical added rows are stored in data/editorial/grammar-als-expansion.json.
expansion = J('data/editorial/grammar-als-expansion.json')
for i, row in enumerate(expansion):
    cid = f"pat-als-{19+i+1:02d}"
    cards.append({
        'id': cid, 'category': 'als', 'collection': 'grammar',
        'dutch': row['dutch'], 'english': row['english'],
        'scenario': row['scenario'], 'scenarioNl': row['scenarioNl'],
        'cue': row['scenario'], 'grammar': row['why'],
        'variation': expansion[(i+1)%len(expansion)]['dutch'],
        'image': '', 'audio': '', 'quizMode': 'order',
        'imageStatus': 'not-applicable', 'audioStatus': 'device',
        'difficulty': 'intermediate', 'vocabularyIds': [], 'review': row['review'],
    })
    examples = []
    for j in range(10):
        other = expansion[(i+j+2)%len(expansion)]
        examples.append({'dutch': other['dutch'], 'english': other['english']})
    notes[cid] = {
        'rule': row['why'] + ' Pattern: Als introduces a conditional or repeated-time subordinate clause. Learn the verb group and main-clause inversion where appropriate.',
        'examples': examples,
    }
assert len(expansion) == 58 and len(cards) == 254, f"Unexpected grammar card count: {len(cards)}"
# New time conjunction topics, extending but not renumbering the original or ALS card IDs.
more = J('data/editorial/grammar-new-time-patterns.json')
by_topic = collections.OrderedDict()
for row in more:
    by_topic.setdefault(row['topic'], []).append(row)
for topic, group in by_topic.items():
    assert len(group) >= 12, f"Need >=12 per topic for unique example notes: {topic}"
    for i, row in enumerate(group):
        cid = f"pat-{topic}-{i+1:02d}"
        cards.append({
            'id': cid, 'category': topic, 'collection': 'grammar',
            'dutch': row['dutch'], 'english': row['english'],
            'scenario': row['scenario'], 'scenarioNl': row['scenarioNl'],
            'cue': row['scenario'], 'grammar': row['why'],
            'variation': group[(i+1)%len(group)]['dutch'],
            'image': '', 'audio': '', 'quizMode': 'order',
            'imageStatus': 'not-applicable', 'audioStatus': 'device',
            'difficulty': 'intermediate', 'vocabularyIds': [], 'review': row['review'],
        })
        notes[cid] = {
            'rule': row['why'],
            'examples': [{'dutch': group[(i+j+2)%len(group)]['dutch'],
                          'english': group[(i+j+2)%len(group)]['english']} for j in range(10)],
        }
assert len(more) == 50 and len(cards) == 304, f"Unexpected number of cards: {len(cards)}"
# Expanded separable verbs: forms are authored and reviewed individually.
more_separable = J('data/editorial/grammar-separable-cards.json')
for i, row in enumerate(more_separable):
    cid = f"pat-separable-{25+i:02d}"
    cards.append({
        'id':cid,'category':'separable','collection':'grammar',
        'dutch':row['dutch'],'english':row['english'],'scenario':row['scenario'],
        'scenarioNl':row['scenarioNl'],'cue':row['scenario'],'grammar':row['why'],
        'variation':more_separable[(i+1)%len(more_separable)]['dutch'],
        'image':'','audio':'','quizMode':'order','imageStatus':'not-applicable','audioStatus':'device',
        'difficulty':'intermediate','vocabularyIds':[],'review':row['review'],
    })
    related=[]
    for step in range(1,100):
        other=more_separable[(i+step*3+1)%len(more_separable)]
        if other['dutch'] != row['dutch'] and other['dutch'] != more_separable[(i+1)%len(more_separable)]['dutch'] and all(x['dutch']!=other['dutch'] for x in related):
            related.append({'dutch':other['dutch'],'english':other['english']})
        if len(related)==10: break
    assert len(related)==10, cid
    notes[cid]={'rule':row['why']+' Focus on the lexical verb and the particle\'s position, not just the tense.','examples':related}
assert len(more_separable)==160 and len(cards)==464, f"Expected 464 generated grammar cards, got {len(cards)}"
# P2 expansions: one file per topic, data/editorial/grammar-p2-<topic>.json. New ids continue after the topic's existing ids
# (they never renumber an earlier card), and the file order is the id order.
import glob
p2_ids = set()
for path in sorted(glob.glob(str(ROOT / 'data/editorial/grammar-p2-*.json'))):
    group = J(pathlib.Path(path).relative_to(ROOT).as_posix())
    topic = group[0]['topic']
    assert all(r['topic'] == topic for r in group), path
    assert len(group) >= 12, f'Need >=12 rows for unique example notes: {path}'
    first = sum(1 for c in cards if c['category'] == topic)
    for i, row in enumerate(group):
        cid = f'pat-{topic}-{first + i + 1:02d}'
        cards.append({
            'id': cid, 'category': topic, 'collection': 'grammar', 'dutch': row['dutch'], 'english': row['english'],
            'scenario': row['scenario'], 'scenarioNl': row['scenarioNl'], 'cue': row['scenario'], 'grammar': row['why'],
            'variation': group[(i + 1) % len(group)]['dutch'], 'image': '', 'audio': '', 'quizMode': 'order',
            'imageStatus': 'not-applicable', 'audioStatus': 'device', 'difficulty': 'intermediate', 'vocabularyIds': [], 'review': row['review'],
        })
        p2_ids.add(cid)
        notes[cid] = {'rule': row['why'], 'examples': [{'dutch': group[(i + j + 2) % len(group)]['dutch'], 'english': group[(i + j + 2) % len(group)]['english']} for j in range(10)]}
assert len({c['dutch'].lower() for c in cards}) == len(cards), 'Duplicate grammar sentence'
# A new P2 sentence must not repeat a core Everyday/Work sentence that is not linked as an alias (it would be a second card with separate progress).
core_text = {}
for name in ['flashcards', 'flashcard-additions', 'flashcard-additions-2', 'workplace-cards']:
    data = J(f'data/{name}.json')
    for c in (data if isinstance(data, list) else data.get('cards', data)):
        core_text[c['dutch'].lower().strip()] = c['id']
linked = {l['sourceId'] for l in J('data/grammar-reuse-links.json')}
for c in cards:
    if c['id'] in p2_ids:
        other = core_text.get(c['dutch'].lower().strip())
        assert other is None or other in linked, f"{c['id']} repeats core sentence {other}"
(ROOT / 'data/grammar-pattern-cards.json').write_text(json.dumps(cards, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(ROOT / 'data/grammar-pattern-notes.json').write_text(json.dumps(notes, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(cards), 'cards;', {t: len(v) for t, v in rows.items()})
