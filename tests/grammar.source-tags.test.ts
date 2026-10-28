import { describe, expect, it } from 'vitest';
import tags from '@/data/grammar-source-tags.json';
import forms from '@/data/grammar-separable-forms.json';
import links from '@/data/grammar-reuse-links.json';
import { CARDS, CORE_CARDS, GRAMMAR_CARDS, newReview, rateLevel } from '@/lib/flashcards/engine';
import { GRAMMAR_AREAS } from '@/lib/content/collections';
import { grammarTagsFor, grammarTopicsFor, originOf, taggedSourcesFor } from '@/lib/grammarTags';
import { eligibleIds, levelCounts, createSession } from '@/lib/sessions/engine';

const core = new Map(CORE_CARDS.map(c => [c.id, c]));
const FRONT_WORDS = new Set('na voor op in bij met door vanaf tijdens naast onder zonder over van uit aan om tegen tussen binnen buiten achter boven tot sinds vanuit vanwege dankzij volgens ondanks behalve per langs rond morgen vandaag gisteren soms daarna eerst helaas misschien later vanavond vanmorgen vanmiddag vroeger hier thuis meestal altijd vaak binnenkort straks eindelijk gelukkig natuurlijk waarschijnlijk normaal ondertussen intussen tegenwoordig uiteindelijk bovendien daarvoor daarover daarmee daarbij daarvan hierover hiervoor hieronder hierna vóór'.split(' '));
const VERBS = new Set('heb hebt heeft hebben ben bent is zijn was waren kan kunt kunnen moet moeten wil wilt willen mag mogen ga gaat gaan zal zullen zou zouden doe doet doen kom komt komen werk werkt werken neem neemt nemen bel belt bellen maak maakt maken stuur stuurt kijk kijkt zie ziet zien zag zagen weet weten wordt worden blijf blijft blijven laat laten hoor hoort geef geeft geven vind vindt vinden denk denkt moest moesten wilde kon konden kwam ging gingen had hadden zit zitten staat staan ligt liggen'.split(' '));
const SUBJECT = new Set('ik je jij u we wij ze zij hij men'.split(' '));
const NOT_FIRST = new Set('als omdat dat of toen terwijl voordat nadat zodra hoewel tenzij want maar en dus die wie wat waar waarom hoe wanneer welke welk hoeveel ik je jij u we wij ze zij hij het men'.split(' '));
/** A non-subject element opens the sentence, a finite verb comes within the first six words, and a personal pronoun subject follows it directly. */
const frontedThenVerbThenSubject = (w: string[]) => {
  if (w.length < 4 || NOT_FIRST.has(w[0])) return false;
  const k = w.slice(0, 7).findIndex(x => VERBS.has(x));
  return k > 0 && k + 1 < w.length && SUBJECT.has(w[k + 1]);
};
const toks = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}'-]+/gu) ?? [];

describe('Grammar source tags: one sentence, several topics, one rating', () => {
  it('points only at real original cards and real grammar topics, with no duplicates', () => {
    const keys = new Set<string>();
    for (const t of tags.tags) {
      expect(core.has(t.id), t.id).toBe(true);
      expect(Object.keys(GRAMMAR_AREAS) as string[], t.topic).toContain(t.topic);
      expect(t.review).toBe('ai-editorial-checked');
      const key = `${t.id}|${t.topic}|${t.evidence}`;
      expect(keys.has(key), key).toBe(false);
      keys.add(key);
    }
  });
  it('does not repeat an explicit grammar alias as a tag', () => {
    const aliased = new Set(links.map(l => `${l.topic}|${l.sourceId}`));
    for (const t of tags.tags) expect(aliased.has(`${t.topic}|${t.id}`), `${t.id} ${t.topic}`).toBe(false);
  });
  it('shows real evidence for every separable-verb tag: the verb is in the sentence, split or joined', () => {
    const table = forms as Record<string, { particle: string; base: string; participle: string; teInfinitive: string; presentIk: string; presentHij: string; pastSingular: string; pastPlural: string }>;
    for (const t of tags.tags.filter(x => x.topic === 'separable')) {
      const f = table[t.evidence];
      expect(f, `${t.id}: ${t.evidence} is in the forms table`).toBeDefined();
      const w = toks(core.get(t.id)!.dutch);
      const p = f.particle.toLowerCase();
      const teForm = core.get(t.id)!.dutch.toLowerCase().includes(f.teInfinitive);
      const joined = teForm || [t.evidence, f.participle, p + f.presentIk, p + f.presentHij, p + f.pastSingular, p + f.pastPlural].some(x => (w as string[]).includes(x));
      const stems = [f.base, f.base + 't', f.presentIk, f.presentHij, f.pastSingular, f.pastPlural];
      const i = w.findIndex(x => stems.includes(x));
      const split = i >= 0 && w.slice(i + 1).includes(p);
      expect(joined || split, `${t.id} "${core.get(t.id)!.dutch}" does not show ${t.evidence}`).toBe(true);
    }
  });
  it('shows the conjunction word for every of / tot tag', () => {
    for (const t of tags.tags.filter(x => x.topic === 'of' || x.topic === 'tot')) {
      const w = toks(core.get(t.id)!.dutch);
      expect((w as string[]).includes(t.topic), t.id).toBe(true);
    }
  });
  it('shows real evidence for every inversion tag: a non-subject element first, then a finite verb, then the subject', () => {
    for (const t of tags.tags.filter(x => x.topic === 'inversion')) {
      const w = toks(core.get(t.id)!.dutch) as string[];
      expect(frontedThenVerbThenSubject(w), `${t.id} "${core.get(t.id)!.dutch}"`).toBe(true);
      expect(t.evidence).toMatch(/^fronted /);
    }
  });
  it('shows the key word for every connectors / exceptions / indirect tag', () => {
    for (const t of tags.tags.filter(x => ['connectors', 'exceptions', 'indirect'].includes(x.topic))) {
      const w = toks(core.get(t.id)!.dutch) as string[];
      const word = t.evidence.split(/[ (]/)[0];
      expect(w, `${t.id}: ${t.evidence}`).toContain(word);
    }
    const te = tags.tags.find(x => x.evidence === 'zonder ... te')!;
    expect(core.get(te.id)!.dutch).toMatch(/zonder .+ te \w+/);
  });
  it('misses no inversion sentence the detector can find: every hit is an alias, a tag or a reviewed false positive', () => {
    const aliased = new Set(links.filter(l => l.topic === 'inversion').map(l => l.sourceId));
    const tagged = new Set(tags.tags.filter(x => x.topic === 'inversion').map(x => x.id));
    // read and rejected: the subject comes first, the opening word is a gerund subject, or a clause (not one element) opens the sentence
    const falsePositives = new Set(['conversation-26', 'career-changes-020', 'career-problems-015']);
    const open: string[] = [];
    for (const c of core.values()) {
      if (c.dutch.trim().endsWith('?')) continue;
      const w = toks(c.dutch) as string[];
      const hit = (FRONT_WORDS.has(w[0]) && w.length >= 4) || frontedThenVerbThenSubject(w);
      if (hit && !aliased.has(c.id) && !tagged.has(c.id) && !falsePositives.has(c.id)) open.push(c.id);
    }
    expect(open).toEqual([]);
  });
  it('records that the core corpus has no further relative clause to tag', () => {
    const relativeAliases = links.filter(l => l.topic === 'relative').map(l => l.sourceId).sort();
    expect(relativeAliases).toEqual(['career-clarification-029', 'career-clarification-053', 'career-support-034']);
    // Every core sentence with die / dat / wie / wat / waar-words after its first word was read once (dat = that or demonstrative,
    // wat = some or what, waar* and waarom = embedded questions). Only the three aliases above are relative clauses. A new core
    // sentence with such a word must be read and added here, so the question is never silently skipped.
    const REVIEWED = new Set(["school-01", "conversation-02", "food-02", "conversation-27", "shopping-19", "conversation-76", "conversation-78", "work-68", "work-131", "work-132", "work-138", "work-139", "work-206", "work-255", "work-323", "career-changes-020", "career-changes-039", "career-clarification-013", "career-clarification-015", "career-clarification-020", "career-clarification-022", "career-clarification-029", "career-clarification-040", "career-clarification-041", "career-clarification-042", "career-clarification-044", "career-clarification-045", "career-clarification-053", "career-clarification-055", "career-incidents-010", "career-incidents-030", "career-incidents-054", "career-meetings-007", "career-meetings-032", "career-meetings-033", "career-meetings-040", "career-meetings-055", "career-office-017", "career-office-020", "career-office-048", "career-priorities-010", "career-priorities-047", "career-problems-060", "career-remote-035", "career-remote-036", "career-remote-054", "career-support-034", "career-support-039", "career-support-050", "career-troubleshooting-040", "career-troubleshooting-054", "career-troubleshooting-057"]);
    const REL = new Set('die dat wie wat waar waarin waarop waarmee waarvoor waarover waaraan waarom waardoor waarvan waarbij'.split(' '));
    const found = [...core.values()].filter(c => (toks(c.dutch) as string[]).some((x, i) => i > 0 && REL.has(x))).map(c => c.id);
    expect(found.filter(id => !REVIEWED.has(id))).toEqual([]);
  });
  it('answers for an original card and for its alias with the same topics', () => {
    const tagged = tags.tags.find(t => t.topic === 'separable')!;
    expect(grammarTagsFor(tagged.id).some(x => x.topic === 'separable' && x.via === 'tag')).toBe(true);
    const link = links[0];
    const alias = GRAMMAR_CARDS.find(c => c.originCardId === link.sourceId)!;
    expect(originOf(alias)).toBe(link.sourceId);
    expect(grammarTopicsFor(originOf(alias)).some(x => x.topic === link.topic)).toBe(true);
    expect(taggedSourcesFor('separable').length).toBeGreaterThan(80);
  });
  it('never puts the same original sentence into one grammar set twice', () => {
    const multi = new Map<string, string[]>();
    for (const c of GRAMMAR_CARDS.filter(x => x.originCardId)) multi.set(c.originCardId!, [...(multi.get(c.originCardId!) ?? []), c.id]);
    const doubled = [...multi].filter(([, ids]) => ids.length > 1);
    expect(doubled.length).toBeGreaterThan(0); // the case really exists: career-support-039 is in two topics
    const reviews = {};
    const ids = eligibleIds('all', 'difficult', reviews, 'nl', 'grammar');
    const origins = ids.map(id => originOf(CARDS.find(c => c.id === id)!));
    expect(new Set(origins).size).toBe(origins.length);
    expect(levelCounts('all', reviews, 'nl', 'grammar').difficult).toBe(ids.length);
    const session = createSession({ topic: 'all', count: 100, level: 'difficult', lang: 'nl', collection: 'grammar', reviews, rand: () => 0.5 })!;
    const sessionOrigins = session.cardIds.map(id => originOf(CARDS.find(c => c.id === id)!));
    expect(new Set(sessionOrigins).size).toBe(sessionOrigins.length);
  });
  it('keeps a separate rating per alias: Everyday mastery does not make the grammar alias mastered', () => {
    const link = links[0];
    const alias = GRAMMAR_CARDS.find(c => c.originCardId === link.sourceId)!;
    const reviews = { [link.sourceId]: rateLevel(link.sourceId, newReview(link.sourceId), 'mastered') };
    expect(eligibleIds(link.topic, 'difficult', reviews, 'nl', 'grammar')).toContain(alias.id);
  });
});
