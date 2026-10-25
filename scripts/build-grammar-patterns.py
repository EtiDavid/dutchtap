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
(ROOT / 'data/grammar-pattern-cards.json').write_text(json.dumps(cards, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(ROOT / 'data/grammar-pattern-notes.json').write_text(json.dumps(notes, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(cards), 'cards;', {t: len(v) for t, v in rows.items()})
