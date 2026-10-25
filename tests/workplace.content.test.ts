import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import workplace from '@/data/workplace-cards.json';
import counts from '@/docs/workplace/content-counts.json';
import baseline from '@/docs/workplace/baseline.json';
import editorialBaseline from '@/docs/learning/preservation.json';
import { protectedEditorialDigest } from './helpers/editorialPreservation';
import originalVocabulary from '@/data/vocabulary.json';
import originalCommunication from '@/data/dutch-communication.json';
import originalNotes from '@/data/grammar-notes.json';
import { CORE_CARDS, EVERYDAY_CARDS, newReview } from '@/lib/flashcards/engine';
import { WORK_AREAS } from '@/lib/content/collections';
import { cardFor, cardsFor } from '@/lib/content/cards';
import { breakdownFor } from '@/lib/grammarBreakdowns';
import { variationsFor, variationCard } from '@/lib/variations/content';
import { communicationFor } from '@/lib/practice/communication';
import { VOCABULARY, wordsForCard } from '@/lib/vocabulary';
import { sentenceTokens } from '@/lib/sessions/wordOrder';
import { syncSchema } from '@/lib/flashcards/validation';
const norm=(s:string)=>s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');

describe('complete Dutch at Work publication',()=>{
  it('adds exactly 60 stable IDs in each of ten areas, preserving the original deck',()=>{
    expect(workplace).toHaveLength(600);expect(CORE_CARDS).toHaveLength(1200);expect(EVERYDAY_CARDS).toHaveLength(600);
    expect(new Set(CORE_CARDS.map(c=>c.id)).size).toBe(1200);
    expect(CORE_CARDS.slice(0,600)).toEqual(EVERYDAY_CARDS);
    for(const area of Object.keys(WORK_AREAS)){
      const batch=workplace.filter(c=>c.category===area);
      expect(batch.map(c=>c.id)).toEqual(Array.from({length:60},(_,i)=>`career-${area}-${String(i+1).padStart(3,'0')}`));
    }
    expect(counts.complete).toBe(true);expect(counts.mainCardsWithoutVocabulary).toEqual([]);
  });
  it('checks actual authored sentences against the published deck, models and teaching examples',()=>{
    const published=new Set([
      ...EVERYDAY_CARDS.map(c=>c.dutch),
      ...Object.values(originalCommunication).flatMap(t=>t.answers.map(a=>a.text)),
      ...Object.values(originalNotes).flatMap(t=>[...t.examples,...('originalExamples' in t ? t.originalExamples : [])].map(e=>e.dutch)),
    ].map(norm));
    const main=workplace.map(c=>norm(c.dutch));expect(new Set(main).size).toBe(600);
    for(const text of main)expect(published.has(text),text).toBe(false);
    const children=new Map<string,string>();const familySets=new Set<string>();let entries=0;
    for(const parent of workplace){
      const family=variationsFor(parent.id);expect(family,parent.id).toHaveLength(10);familySets.add(family.map(v=>norm(v.text)).sort().join("|"));
      expect(new Set(family.map(v=>norm(v.text))).size,parent.id).toBe(10);
      for(const child of family){
        entries++;expect(child.id).toMatch(new RegExp(`^${parent.id}~v\\d{2}$`));
        expect(published.has(norm(child.text)),child.id).toBe(false);expect(main).not.toContain(norm(child.text));
        children.set(norm(child.text),child.id);
        const card=variationCard(child.id)!;expect(card.collection).toBe('workplace');expect(card.audio).toBeUndefined();expect(card.image).toBe('');
      }
    }
    expect(entries).toBe(6000);expect(children.size).toBe(720);expect(familySets.size).toBe(600);
    expect(counts.childEntries).toBe(entries);expect(counts.distinctChildSentences).toBe(children.size);
  });
  it('resolves genuine situations, explanations and quiz-compatible reviewed answers for every parent and child',()=>{
    for(const parent of workplace){
      const b=breakdownFor(parent.id)!;
      expect(b.parts.map(p=>p.text).join(' ')).toBe(parent.dutch);
      expect(b.forms.length).toBeGreaterThan(100);expect(b.forms).toContain('past singular');
      expect(b.mistake.right).toBe(parent.dutch);expect(b.mistake.wrong).not.toBe(parent.dutch);
      for(const card of [cardFor('nl',parent.id)!,...variationsFor(parent.id).map(v=>variationCard(v.id)!)]){
        const task=communicationFor(card);
        expect(task.scenario.split(/\s+/).length,card.id).toBeGreaterThanOrEqual(12);
        expect(task.scenario).not.toMatch(/^(Translate|Say this in Dutch|Use Dutch to convey)/);
        expect(task.answers[0].text).toBe(card.text);
        expect(new Set(task.answers.map(a=>a.id)).size).toBe(task.answers.length);
        for(const a of task.answers){
          expect(a.english.length).toBeGreaterThan(3);expect(a.explanation.length).toBeGreaterThan(40);
          expect(sentenceTokens(a.text).length,card.id).toBeLessThanOrEqual(40);
          expect(a.id).toMatch(/^(model|a-[a-f0-9]{12})$/);
        }
      }
    }
  });
  it('keeps new media intentionally absent, starts Difficult, and links every parent to real text-only vocabulary',()=>{
    const ids=new Set(VOCABULARY.map(v=>v.id));expect(ids.size).toBe(VOCABULARY.length);
    for(const c of workplace){
      expect(c.collection).toBe('workplace');expect(c.image).toBe('');expect(c.audio).toBe('');
      expect(c.imageStatus).toBe('not-applicable');expect(c.audioStatus).toBe('device');
      expect(c.review.independentHumanReview).toBe(false);expect(newReview(c.id).level).toBe('difficult');
      const words=wordsForCard(c.id);expect(words.length,c.id).toBeGreaterThan(0);
      for(const id of c.vocabularyIds){
        const word=words.find(w=>w.id===id)!;expect(word,id).toBeDefined();
        expect(word.occurrences.some(o=>o.cardId===c.id&&norm(c.dutch).includes(norm(o.form))),id).toBe(true);
        expect(word).not.toHaveProperty('image');expect(word).not.toHaveProperty('audio');
      }
    }
    for(const original of originalVocabulary){
      const merged=VOCABULARY.find(v=>v.id===original.id)!;
      const { lessonIds: _lessons, learningDetails: _details, ...preserved } = merged;
      expect(_lessons === undefined || Array.isArray(_lessons)).toBe(true);
      expect(_details === undefined || typeof _details === 'string').toBe(true);
      expect({...preserved,occurrences:original.occurrences}).toEqual(original);
      expect(merged.occurrences.slice(0,original.occurrences.length)).toEqual(original.occurrences);
    }
  });
  it('keeps existing word senses separate from new workplace meanings',()=>{
    const ids=(id:string)=>wordsForCard(id).map(w=>w.id);
    expect(ids('career-office-007')).not.toContain('career-werk');
    expect(ids('career-clarification-041')).not.toContain('career-vraag');
    expect(ids('career-remote-041')).not.toContain('career-antwoord');
    expect(ids('career-changes-001')).toContain('career-leesrecht');
    expect(ids('career-support-021')).toContain('beschikbaar');
    expect(ids('career-office-045')).toContain('career-gevoel');
    expect(ids('career-office-010')).toContain('career-voorstellen-introduce');expect(ids('career-office-010')).not.toContain('voorstellen');
    expect(ids('career-clarification-021')).toContain('career-voordoen-demonstrate');expect(ids('career-clarification-021')).not.toContain('voordoen');
    expect(ids('career-problems-003')).toContain('career-laden-data');expect(ids('career-problems-003')).not.toContain('laden');
    expect(ids('career-troubleshooting-028')).toContain('career-sluiten-window');expect(ids('career-troubleshooting-028')).not.toContain('sluiten');
    expect(ids('career-office-030')).toContain('career-dienst-shift');expect(ids('career-office-030')).not.toContain('dienst');
    expect(ids('career-meetings-041')).toContain('career-afspreken-agreement');expect(ids('career-meetings-053')).toContain('afspreken');
  });
  it('preserves protected data, all 1,200 existing media files and the French-only deck',()=>{
    // Only explanation/scenario metadata is editable in these three files.
    // The original sentences, historical answers and related examples remain frozen.
    for(const [path,digest] of Object.entries({...baseline.files,...baseline.assets})) {
      const contract = editorialBaseline.files[path as keyof typeof editorialBaseline.files];
      if (contract) {
        expect(protectedEditorialDigest(path, JSON.parse(readFileSync(path, 'utf8')), editorialBaseline.addedRawAnswerIds), path).toBe(contract);
      } else expect(hash(path),path).toBe(digest);
    }
    expect(cardsFor('fr')).toHaveLength(600);
    for(const c of workplace){expect(cardFor('fr',c.id)).toBeUndefined();expect(syncSchema.safeParse({lang:'fr',records:[newReview(c.id)]}).success).toBe(false);}
    expect(syncSchema.safeParse({records:[newReview(workplace[0].id)]}).success).toBe(true);
  });
});
