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
assert len({c['dutch'].lower() for c in cards}) == len(cards), 'Duplicate grammar sentence'
(ROOT / 'data/grammar-pattern-cards.json').write_text(json.dumps(cards, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(ROOT / 'data/grammar-pattern-notes.json').write_text(json.dumps(notes, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(cards), 'cards;', {t: len(v) for t, v in rows.items()})
