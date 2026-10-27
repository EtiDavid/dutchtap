import { describe, expect, it } from 'vitest';
import { GRAMMAR_CARDS } from '@/lib/flashcards/engine';
import { cardFor } from '@/lib/content/cards';
import { separableFormsFor } from '@/lib/separableForms';
import { breakdownFor } from '@/lib/grammarBreakdowns';
import { DAT_ANALYSIS, GRAMMAR_ANALYSIS, OMDAT_ANALYSIS, TOEN_ANALYSIS, WANNEER_ANALYSIS, INVERSION_ANALYSIS, SEPARABLE_ANALYSIS, type AnalysisRecord } from '@/lib/grammarAnalysis';

const words = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}' ]/gu, ' ').replace(/’/g, "'").split(/\s+/).filter(Boolean);
const GENERIC = [/because it is (a )?subordinate\b/i, /^dutch uses inversion\.?$/i, /\bthis is correct grammar\b/i, /^the verb goes to the end\.?$/i, /^op is a separable prefix\.?$/i, /subject and verb switch\.?$/i];
const ALL_CONJ = /\b(als|wanneer|zodra|toen|omdat|want|daarom|dus|terwijl|voordat|nadat|totdat)\b/i;

type TopicConfig = { topic: string; records: Record<string, AnalysisRecord>; conj: string[]; target: number; leak?: RegExp };
const TOPICS: TopicConfig[] = [
  { topic: 'omdat', records: OMDAT_ANALYSIS, conj: ['omdat'], target: 100 },
  { topic: 'dat', records: DAT_ANALYSIS, conj: ['dat', 'die'], target: 100, leak: /\bdat\b/i },
  { topic: 'toen', records: TOEN_ANALYSIS, conj: ['toen'], target: 100 },
  { topic: 'wanneer', records: WANNEER_ANALYSIS, conj: ['wanneer'], target: 100 },
  { topic: 'inversion', records: INVERSION_ANALYSIS, conj: [], target: 100 },
  { topic: 'separable', records: SEPARABLE_ANALYSIS, conj: ['dat'], target: 176 },
];

const seenText = new Map<string, string>();

for (const { topic, records, conj, target, leak } of TOPICS) {
  const ids = Object.keys(records);
  describe(`${topic}: per-sentence analysis (hand-authored, reviewed spans)`, () => {
    it('belongs to real grammar cards of this topic, by their exact ids', () => {
      for (const id of ids) {
        const card = cardFor('nl', id);
        expect(card, id).toBeDefined();
        expect(card!.collection, id).toBe('grammar');
        expect(card!.category, id).toBe(topic);
        expect(GRAMMAR_ANALYSIS[id], `${id} id is unique across topics`).toBe(records[id]);
      }
    });
    it('cuts every sentence into parts and clauses that rebuild exactly that sentence, in order', () => {
      for (const id of ids) {
        const card = cardFor('nl', id)!;
        const record = records[id];
        expect(words(record.parts.map(p => p.text).join(' ')), `${id} parts`).toEqual(words(card.text));
        expect(words(record.clauses.map(c => c.text).join(' ')), `${id} clauses`).toEqual(words(card.text));
        for (const part of record.parts) expect(part.label.length, id).toBeGreaterThan(2);
      }
    });
    it('names a real finite verb and subject per clause and puts the topic word where the pattern says', () => {
      for (const id of ids) {
        const record = records[id];
        const kinds = record.clauses.map(c => c.kind).join('+');
        const dependent = (clause: (typeof record.clauses)[number], starts: string[]) => {
          expect(words(clause.text).slice(0, 2).some(w => starts.includes(w)), `${id}: dependent clause starts with ${starts.join('/')}`).toBe(true);
          const spoken = words(clause.text);
          const after = clause.afterFinite ? words(clause.afterFinite).length : 0;
          expect(spoken.length - after - spoken.indexOf(words(clause.finite)[0]), `${id}: finite verb is near the end`).toBeLessThanOrEqual(2);
        };
        if (record.pattern === 'coordinate') {
          expect(kinds, id).toBe('hoofdzin+hoofdzin');
          expect(words(record.clauses[1].text)[0], `${id}: second main clause`).not.toBe(conj[0]);
        } else if (record.pattern === 'split' || record.pattern === 'joined') {
          expect(kinds, id).toBe('hoofdzin');
          const forms = separableFormsFor(id)!;
          expect(forms, `${id}: a separable verb is attached to the card`).toBeDefined();
          const spoken = words(record.clauses[0].text);
          const verbAt = spoken.indexOf(words(record.clauses[0].finite)[0]);
          if (record.pattern === 'split') {
            expect(spoken.indexOf(forms.particle, verbAt + 1), `${id}: particle ${forms.particle} is split off behind the finite verb`).toBeGreaterThan(verbAt);
          } else {
            const joined = [forms.participle, forms.lemma].some(w => spoken.includes(w)) || spoken.join(' ').includes(forms.teInfinitive);
            expect(joined, `${id}: the verb stays in one piece`).toBe(true);
          }
        } else if (record.pattern === 'inverted') {
          expect(kinds, id).toBe('hoofdzin');
          const spoken = words(record.clauses[0].text);
          const verbAt = spoken.indexOf(words(record.clauses[0].finite)[0]);
          const subjectAt = spoken.indexOf(words(record.clauses[0].subject)[0], verbAt + 1);
          expect(verbAt, `${id}: a fronted element precedes the finite verb`).toBeGreaterThan(0);
          expect(subjectAt, `${id}: the subject follows the finite verb`).toBeGreaterThan(verbAt);
          expect(record.parts[0].label.toLowerCase(), `${id}: first part is labelled fronted`).toContain('fronted');
        } else if (record.pattern === 'demonstrative') {
          expect(kinds, id).toBe('hoofdzin');
          expect(words(record.clauses[0].text).some(w => conj.includes(w)), `${id}: the pointing word is in the clause`).toBe(true);
        } else if (record.pattern === 'relative') {
          expect(['hoofdzin+bijzin', 'hoofdzin+bijzin+hoofdzin'], id).toContain(kinds);
          dependent(record.clauses.find(c => c.kind === 'bijzin')!, conj);
        } else {
          expect(['bijzin+hoofdzin', 'hoofdzin+bijzin', 'bijzin+hoofdzin+bijzin'], id).toContain(kinds);
          const bijzin = record.clauses.filter(c => c.kind === 'bijzin').find(c => words(c.text).slice(0, 2).some(w => conj.includes(w))) ?? record.clauses.find(c => c.kind === 'bijzin')!;
          dependent(bijzin, conj);
        }
        for (const clause of record.clauses) {
          // a main clause cut in two by a relative clause carries its finite verb in the second half
          const split = record.pattern === 'relative' && record.clauses.length === 3 && clause.kind === 'hoofdzin';
          const finiteIn = split ? `${record.clauses[0].text} ${record.clauses[2].text}` : clause.text;
          expect(words(finiteIn), `${id}: finite ${clause.finite}`).toContain(words(clause.finite)[0]);
          if (!clause.subject.startsWith('(')) expect(words(clause.text).join(' '), `${id}: subject ${clause.subject}`).toContain(words(clause.subject).join(' '));
          expect(clause.why.toLowerCase(), `${id}: why names ${clause.finite}`).toContain(clause.finite.toLowerCase());
          expect(clause.why.length, id).toBeGreaterThan(60);
        }
      }
    });
    it('gives real mistakes that correct to the model sentence, a contrast, and a specific reason each', () => {
      for (const id of ids) {
        const card = cardFor('nl', id)!;
        const record = records[id];
        expect(record.mistakes.length, id).toBeGreaterThanOrEqual(1);
        for (const mistake of record.mistakes) {
          expect(words(mistake.right), `${id} corrects to the model`).toEqual(words(card.text));
          expect(words(mistake.wrong).join(' '), id).not.toBe(words(mistake.right).join(' '));
          expect(mistake.why.length, id).toBeGreaterThan(40);
        }
        expect(words(record.contrast.dutch).join(' '), id).not.toBe(words(card.text).join(' '));
        expect(record.contrast.english.length, id).toBeGreaterThan(10);
        expect(record.contrast.note.length, id).toBeGreaterThan(40);
      }
    });
    it('is specific to each sentence: no generic explanation and no text reused across cards or topics', () => {
      for (const id of ids) {
        const record = records[id];
        const texts = [record.meaning, record.order, record.forms, record.compare, record.sense?.why ?? '', record.contrast.note, ...record.mistakes.map(m => m.why), ...record.clauses.map(c => c.why)];
        for (const text of texts) {
          for (const pattern of GENERIC) expect(text, id).not.toMatch(pattern);
          expect(seenText.get(text), `${id} repeats text from ${seenText.get(text)}`).toBeUndefined();
          seenText.set(text, id);
        }
        expect(record.order.length, id).toBeGreaterThan(110);
        expect(record.compare.length, id).toBeGreaterThan(70);
        expect(record.sense?.label, id).toBeTruthy();
        expect(record.sense!.why.length, id).toBeGreaterThan(30);
        expect(record.status).toBe('ai-editorial-checked');
        expect(JSON.stringify(record), id).not.toMatch(/always (the )?(very )?last|invariably last/i);
      }
    });
    it('offers a Dutch-first situation that does not give the conjunction away', () => {
      for (const id of ids) {
        const card = cardFor('nl', id)!;
        expect(card.scenarioNl, id).toBeTruthy();
        expect(card.scenarioNl!, id).not.toMatch(ALL_CONJ);
        if (leak) expect(card.scenarioNl!, id).not.toMatch(leak);
        expect(card.scenarioNl!.toLowerCase(), id).not.toContain(words(card.text).join(' '));
        expect(card.scenarioNl!.length, id).toBeGreaterThan(40);
        const breakdown = breakdownFor(id)!;
        expect(breakdown.clauses?.length, id).toBe(records[id].clauses.length);
        expect(breakdown.sense, id).toBeDefined();
      }
    });
    it(`covers every ${topic} base card (legacy, new and linked) and only those`, () => {
      const base = GRAMMAR_CARDS.filter(c => c.category === topic);
      expect(base.length).toBe(target);
      expect(base.filter(c => !records[c.id]).map(c => c.id)).toEqual([]);
      expect(ids.filter(id => !base.some(c => c.id === id))).toEqual([]);
    });
  });
}
