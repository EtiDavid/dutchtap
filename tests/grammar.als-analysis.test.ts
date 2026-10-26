import { describe, expect, it } from 'vitest';
import { CARDS } from '@/lib/flashcards/engine';
import { cardFor } from '@/lib/content/cards';
import { breakdownFor } from '@/lib/grammarBreakdowns';
import { ALS_ANALYSIS, analysisFor } from '@/lib/grammarAnalysis';

const words = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}' ]/gu, ' ').replace(/’/g, "'").split(/\s+/).filter(Boolean);
const ids = Object.keys(ALS_ANALYSIS);
const alsCards = CARDS.filter(c => c.collection === 'grammar' && c.category === 'als');
const GENERIC = [/because it is (a )?subordinate\b/i, /^dutch uses inversion\.?$/i, /\bthis is correct grammar\b/i, /^the verb goes to the end\.?$/i, /^op is a separable prefix\.?$/i, /subject and verb switch\.?$/i];

describe('ALS per-sentence analysis (hand-authored, reviewed spans)', () => {
  it('belongs to real ALS grammar cards, by their exact IDs', () => {
    expect(ids.length).toBeGreaterThanOrEqual(10);
    for (const id of ids) {
      const card = cardFor('nl', id);
      expect(card, id).toBeDefined();
      expect(card!.collection, id).toBe('grammar');
      expect(card!.category, id).toBe('als');
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cuts every sentence into parts and clauses that rebuild exactly that sentence, in order', () => {
    for (const id of ids) {
      const card = cardFor('nl', id)!;
      const record = analysisFor(id)!;
      expect(words(record.parts.map(p => p.text).join(' ')), `${id} parts`).toEqual(words(card.text));
      expect(words(record.clauses.map(c => c.text).join(' ')), `${id} clauses`).toEqual(words(card.text));
      for (const part of record.parts) expect(part.label.length, id).toBeGreaterThan(2);
    }
  });

  it('names a real finite verb and subject inside each clause, and exactly one main and one subordinate clause that starts with als', () => {
    for (const id of ids) {
      const { clauses } = analysisFor(id)!;
      expect(clauses.map(c => c.kind).sort(), id).toEqual(['bijzin', 'hoofdzin']);
      for (const clause of clauses) {
        const own = words(clause.text);
        expect(own, `${id}: finite ${clause.finite}`).toContain(words(clause.finite)[0]);
        if (!clause.subject.startsWith('(')) expect(words(clause.text).join(' '), `${id}: subject ${clause.subject}`).toContain(words(clause.subject).join(' '));
        expect(clause.why.toLowerCase(), `${id}: why names ${clause.finite}`).toContain(clause.finite.toLowerCase());
        expect(clause.why.length, id).toBeGreaterThan(60);
      }
      const bijzin = clauses.find(c => c.kind === 'bijzin')!;
      expect(words(bijzin.text).slice(0, 2).includes('als'), `${id}: bijzin starts with als`).toBe(true);
      // The finite verb closes a simple dependent clause; with a verb group it is one of the last two words. A phrase after the verb
      // (for example a place phrase) is allowed only when the record names it explicitly.
      const spoken = words(bijzin.text);
      const after = bijzin.afterFinite ? words(bijzin.afterFinite).length : 0;
      if (bijzin.afterFinite) expect(words(bijzin.text).join(' '), id).toMatch(new RegExp(`${words(bijzin.finite)[0]} ${words(bijzin.afterFinite).join(' ')}$`));
      expect(spoken.length - after - spoken.indexOf(words(bijzin.finite)[0]), id).toBeLessThanOrEqual(2);
    }
  });

  it('gives a real mistake that is not the model, correcting to the model sentence, with its own reason', () => {
    for (const id of ids) {
      const card = cardFor('nl', id)!;
      const { mistakes } = analysisFor(id)!;
      expect(mistakes.length, id).toBeGreaterThanOrEqual(1);
      for (const mistake of mistakes) {
        expect(words(mistake.right), `${id} corrects to the model`).toEqual(words(card.text));
        expect(words(mistake.wrong).join(' '), id).not.toBe(words(mistake.right).join(' '));
        expect(mistake.why.length, id).toBeGreaterThan(40);
      }
    }
  });

  it('contrasts with a different, equally meaningful way to say it and explains why it differs', () => {
    for (const id of ids) {
      const card = cardFor('nl', id)!;
      const { contrast } = analysisFor(id)!;
      expect(words(contrast.dutch).join(' '), id).not.toBe(words(card.text).join(' '));
      expect(contrast.english.length, id).toBeGreaterThan(10);
      expect(contrast.note.length, id).toBeGreaterThan(40);
    }
  });

  it('is specific to each sentence: no generic explanation and no explanation text reused across cards', () => {
    const seen = new Map<string, string>();
    for (const id of ids) {
      const record = analysisFor(id)!;
      const texts = [record.meaning, record.order, record.forms, record.compare, record.alsSenseWhy, record.contrast.note, ...record.mistakes.map(m => m.why), ...record.clauses.map(c => c.why)];
      for (const text of texts) {
        for (const pattern of GENERIC) expect(text, id).not.toMatch(pattern);
        expect(seen.get(text), `${id} repeats text from ${seen.get(text)}`).toBeUndefined();
        seen.set(text, id);
      }
      expect(record.order.length, id).toBeGreaterThan(120);
      expect(record.compare.length, id).toBeGreaterThan(80);
      expect(['if', 'when', 'whenever', 'only-when']).toContain(record.alsSense);
      expect(record.status).toBe('ai-editorial-checked');
    }
  });

  it('never claims that the finite verb is always the very last word of a subordinate clause', () => {
    for (const id of ids) expect(JSON.stringify(analysisFor(id)), id).not.toMatch(/always (the )?(very )?last|invariably last/i);
  });

  it('offers Dutch-first situations that do not leak the conjunction or the model sentence', () => {
    for (const id of ids) {
      const card = cardFor('nl', id)!;
      expect(card.scenarioNl, `${id} has a Dutch-first situation`).toBeTruthy();
      expect(card.scenarioNl!, id).not.toMatch(/\b(als|wanneer|zodra|toen)\b/i);
      expect(card.scenarioNl!.toLowerCase(), id).not.toContain(words(card.text).join(' '));
      expect(card.scenarioNl!.length, id).toBeGreaterThan(40);
    }
  });

  it('rewrites an English situation only where the original gave the Dutch answer away, and the rewrite does not', () => {
    for (const id of ids.filter(i => analysisFor(i)!.situationEn)) {
      const card = cardFor('nl', id)!;
      expect(card.scenario, id).toBe(analysisFor(id)!.situationEn);
      expect(card.scenario.toLowerCase(), id).not.toContain(words(card.text).slice(0, 3).join(' '));
      expect(card.scenario, id).not.toMatch(/\bals\b/i);
    }
  });

  it('is shown through the existing breakdown view, with clauses, extra mistakes and the contrast', () => {
    for (const id of ids) {
      const breakdown = breakdownFor(id)!;
      expect(breakdown.clauses?.length, id).toBe(2);
      expect(breakdown.contrast, id).toBeDefined();
      expect(breakdown.alsSense, id).toBeDefined();
      expect(breakdown.mistake.right, id).toBeTruthy();
    }
  });

  it('keeps the original card ids and sentences untouched (analysis is an overlay)', () => {
    for (const id of ids) {
      const original = CARDS.find(c => c.id === id)!;
      expect(cardFor('nl', id)!.text).toBe(original.dutch);
    }
    expect(alsCards.length).toBe(100);
  });
});
