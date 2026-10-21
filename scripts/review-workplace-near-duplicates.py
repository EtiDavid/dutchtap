#!/usr/bin/env python3
"""Print near-duplicate candidates for editorial review, without approving or changing content.
Only a heuristic: lexical similarity cannot establish semantic equivalence.
"""
import difflib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
normalise = lambda text: re.sub(r'[^\w]+', ' ', text.lower()).strip()
old = []
for name in ['flashcards.json', 'flashcard-additions.json', 'flashcard-additions-2.json']:
    old += [(c['id'], c['dutch']) for c in json.loads((ROOT / 'data' / name).read_text())]
for task in json.loads((ROOT / 'data/dutch-communication.json').read_text()).values():
    old += [('published-model', answer['text']) for answer in task['answers']]
for id, note in json.loads((ROOT / 'data/grammar-notes.json').read_text()).items():
    old += [(id + '-example', e['dutch']) for key in ['examples', 'originalExamples'] for e in note.get(key, [])]
unique = {}
for id, text in old:
    unique.setdefault(normalise(text), (id, text))
new = json.loads((ROOT / 'data/workplace-cards.json').read_text())
seen = [(key, id, text) for key, (id, text) in unique.items()]
candidates = []
for c in new:
    a = normalise(c['dutch'])
    matches = []
    for b, id, text in seen:
        if min(len(a), len(b)) / max(len(a), len(b)) < .8:
            continue
        matcher = difflib.SequenceMatcher(None, a, b)
        if matcher.quick_ratio() < .86:
            continue
        ratio = matcher.ratio()
        if ratio >= .86:
            matches.append((ratio, id, text))
    for ratio, id, text in sorted(matches, reverse=True)[:2]:
        candidates.append({'id': c['id'], 'text': c['dutch'], 'comparedId': id, 'comparedText': text, 'similarity': round(ratio, 3)})
    seen.append((a, c['id'], c['dutch']))
print(json.dumps({'comparison': 'New parents versus existing main cards, published model answers, grammar examples and earlier new parents', 'threshold': .86, 'minimumLengthRatio': .8, 'existingDistinctSentences': len(unique), 'candidates': candidates, 'warning': 'A heuristic screen; editorial meaning/context review is still required.'}, ensure_ascii=False, indent=2))
