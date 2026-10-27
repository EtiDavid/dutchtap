#!/usr/bin/env python3
"""Tags existing Everyday / Dutch at Work sentences with the grammar topics they genuinely practise.

A tag is NOT a new card: it points at the one original card, which keeps a single sentence, audio and rating.
Detection is automatic (separable-verb forms from data/grammar-separable-forms.json, conjunction words), but every
candidate was reviewed by hand: REJECT and LEMMAS below record the decisions, and docs/GRAMMAR-SOURCE-TAGGING.md
lists them with reasons. Run: python3 scripts/tag-grammar-sources.py
"""
import json, re, collections, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
J = lambda p: json.loads((ROOT / p).read_text(encoding='utf-8'))
core = []
for n in ['flashcards', 'flashcard-additions', 'flashcard-additions-2', 'workplace-cards']:
    d = J(f'data/{n}.json'); core += d if isinstance(d, list) else d.get('cards', d)
by = {c['id']: c['dutch'] for c in core}
forms = J('data/grammar-separable-forms.json')
tok = lambda s: re.findall(r"[\wëïéè'-]+", s.lower())

# --- separable verbs: automatic detection, then the manual review below -------------------------------------------------
def detect(sentence):
    t = tok(sentence); found = []
    for lem, f in forms.items():
        p = f['particle'].lower()
        joined = {lem, f['participle'], p + f['presentIk'], p + f['presentHij'], p + f['pastSingular'], p + f['pastPlural']}
        if any(j in t for j in joined): found.append(lem); continue
        stems = {f['base'], f['base'] + 't', f['presentIk'], f['presentHij'], f['pastSingular'], f['pastPlural']}
        idx = [i for i, w in enumerate(t) if w in stems]
        if idx and p in t[idx[0] + 1:]: found.append(lem)
    return found

# Rejected after reading the sentence: nominal use (het opruimen), noun/adjective (aanvraag, afgesproken), a different
# verb (afnemen, op zich nemen, overdragen), a quoted word, or a preposition that only looks like a particle.
REJECT = {
 'home-13': 'nominal infinitive (voor het opruimen)', 'work-147': 'nominal infinitive (met het opruimen)',
 'work-269': 'nominal infinitive (bij het aanvragen)', 'career-changes-009': 'noun aanvraag, not the verb',
 'career-changes-048': 'adjective afgesproken (het afgesproken moment)', 'career-changes-057': 'nominal infinitive (voor het terugdraaien)',
 'career-clarification-020': 'quoted word, not used as a verb', 'career-clarification-027': 'false match: no separable verb',
 'career-clarification-028': 'false match: no separable verb', 'career-clarification-030': 'noun uitleg; opsplitsen is not in the forms table',
 'career-incidents-018': 'different verb (afnemen)', 'career-meetings-052': 'op zich nemen, not a separable particle',
 'career-priorities-004': 'noun aanvraag', 'career-priorities-031': 'adjective afgesproken', 'career-priorities-046': 'op zich nemen, not a separable particle',
 'career-priorities-048': 'noun aanvragen', 'career-priorities-060': 'overdragen, not overnemen', 'career-problems-010': 'nominal infinitive (na het aanmelden)',
 'career-support-007': 'false match: no separable verb', 'career-support-020': 'noun uitleg', 'career-support-048': 'false match: no separable verb',
 'career-support-055': 'false match: no separable verb', 'career-support-058': 'quoted word (Afsluiten betekent...)',
 'career-troubleshooting-002': 'false match: no separable verb', 'career-troubleshooting-013': 'false match: no separable verb',
}
# Only some of the detected lemmas are right for these sentences.
LEMMAS = {'career-clarification-024': ['uitvoeren'], 'career-problems-044': ['afronden'], 'career-problems-005': ['vastlopen']}

tags = []
for c in core:
    if c['id'] in REJECT: continue
    lems = LEMMAS.get(c['id'], detect(c['dutch']))
    for lem in lems:
        tags.append({'id': c['id'], 'topic': 'separable', 'evidence': lem, 'review': 'ai-editorial-checked'})

# --- conjunction topics: curated by hand (every `als`/`dat`/`of` hit was read; most are `as`, `that`, `or`) ---------------
EXTRA = [
 ('career-changes-060', 'of', 'of = whether'), ('career-incidents-017', 'of', 'of = whether'), ('career-remote-027', 'of', 'of = whether'),
 ('career-support-017', 'of', 'of = whether'),
 ('work-169', 'of', 'of = or'), ('career-clarification-008', 'of', 'of = or'), ('career-clarification-018', 'of', 'of = or'),
 ('career-clarification-035', 'of', 'of = or'), ('career-priorities-004', 'of', 'of = or'), ('career-support-015', 'of', 'of = or'),
 ('career-changes-002', 'tot', 'toegang tot'), ('career-changes-003', 'tot', 'toegang tot'), ('career-changes-009', 'tot', 'toegang tot'),
 ('career-problems-054', 'tot', 'toegang tot'),
 ('career-remote-036', 'indirect', 'wie = who (embedded)'), ('career-support-007', 'indirect', 'op welk nummer (embedded)'),
 ('career-support-039', 'indirect', 'wat = what (embedded)'), ('conversation-78', 'indirect', 'waarom = why (elliptical)'),
 ('career-clarification-040', 'indirect', 'wat = what (embedded)'), ('career-office-017', 'indirect', 'waar = where (embedded)'),
 # --- inversion: a non-subject element in position one, the finite verb second, the subject behind it. The 38 sentences that
 # match this and are already explicit aliases need no tag; these 7 were read and accepted. Relative clauses: the core
 # corpus has only 3 (career-clarification-029, -053, career-support-034), all already aliases, so there is nothing to tag.
 ('career-clarification-028', 'inversion', 'fronted prepositional phrase'), ('career-clarification-040', 'inversion', 'fronted prepositional phrase'),
 ('career-meetings-019', 'inversion', 'fronted prepositional phrase'), ('career-meetings-038', 'inversion', 'fronted prepositional phrase'),
 ('career-meetings-035', 'inversion', 'fronted adverb (daarover)'), ('career-remote-001', 'inversion', 'fronted adverb (hieronder)'),
 ('career-priorities-023', 'inversion', 'fronted object'),
 # --- the newer connector topics (sinds, zodat; ondanks, zonder): mostly the preposition contrast, one real clause each
 ('career-priorities-034', 'connectors', 'zodat'), ('career-meetings-010', 'connectors', 'sinds (preposition)'),
 ('career-office-034', 'connectors', 'sinds (preposition)'), ('career-incidents-010', 'connectors', 'sinds (preposition)'),
 ('work-164', 'exceptions', 'ondanks (preposition)'), ('work-282', 'exceptions', 'zonder (preposition)'),
 ('career-changes-007', 'exceptions', 'zonder (preposition)'), ('career-meetings-028', 'exceptions', 'zonder (preposition)'),
 ('career-meetings-022', 'exceptions', 'zonder (preposition)'), ('career-troubleshooting-018', 'exceptions', 'zonder (preposition)'),
 ('career-clarification-040', 'exceptions', 'zonder (preposition)'), ('career-troubleshooting-028', 'exceptions', 'zonder ... te'),
 ('career-changes-020', 'exceptions', 'zonder dat'),
]
for i, topic, ev in EXTRA:
    assert i in by, i
    tags.append({'id': i, 'topic': topic, 'evidence': ev, 'review': 'ai-editorial-checked'})

# a card that is already an explicit grammar alias in that topic needs no second link
linked = {(l['topic'], l['sourceId']) for l in J('data/grammar-reuse-links.json')}
tags = [t for t in tags if (t['topic'], t['id']) not in linked]
seen = set(); out = []
for t in tags:
    k = (t['id'], t['topic'], t['evidence'])
    if k in seen: continue
    seen.add(k); out.append(t)
out.sort(key=lambda t: (t['topic'], t['id'], t['evidence']))
(ROOT / 'data/grammar-source-tags.json').write_text(json.dumps({
 'version': 1,
 'note': 'Reviewed pointers from existing Everyday / Dutch at Work sentences to the grammar topics they practise. A tag adds no card and no second rating; AI-editorial-checked, not native-reviewed.',
 'tags': out}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(out), 'tags;', dict(collections.Counter(t['topic'] for t in out)), 'rejected', len(REJECT))
