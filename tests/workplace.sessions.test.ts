import { describe, it, expect } from 'vitest';
import workplace from '@/data/workplace-cards.json';
import { cardsFor, cardFor, hasContent } from '@/lib/content/cards';
import { createSession, createSessionFromIds, eligibleIds, levelCounts, practiseAgain, applyAction } from '@/lib/sessions/engine';
import { sessionSchema } from '@/lib/sessions/types';
import { communicationFor, matchAnswer } from '@/lib/practice/communication';
import { variationsFor } from '@/lib/variations/content';
import { sentenceTokens, tokenId } from '@/lib/sessions/wordOrder';
import { run, uid, NOW } from './helpers/sessions';

const fresh = (id = 'career-office-007') => createSessionFromIds({ name:'Workplace', cardIds:[id], topic:'office', collection:'workplace', startingLevel:'difficult', now:NOW });
describe('collection selection and compatibility', () => {
  it('keeps the old all-places pool restricted to the original 600, with an explicit separate work pool', () => {
    expect(eligibleIds('all','difficult',{})).toHaveLength(600);
    expect(eligibleIds('all','difficult',{},'nl','workplace')).toHaveLength(workplace.length);
    expect(eligibleIds('all','difficult',{},'fr','workplace')).toEqual([]);
    expect(cardsFor('fr')).toHaveLength(600);
    for (const c of workplace) { expect(hasContent('fr',c.id)).toBe(false); expect(cardFor('nl',c.id)?.audio).toBeUndefined(); }
  });
  it('never substitutes another collection, topic or level when there are too few eligible cards', () => {
    const base={topic:'office',level:'difficult' as const,lang:'nl' as const,collection:'workplace' as const,reviews:{}};
    expect(createSession({...base,count:100})).toBeNull();
    expect(createSession({...base,topic:'shopping',count:1})).toBeNull();
    expect(createSession({...base,lang:'fr',count:1})).toBeNull();
    expect(createSession({...base,level:'easy',count:1})).toBeNull();
    const s=createSession({...base,count:10})!;
    expect(s.cardIds).toHaveLength(10);
    expect(s.cardIds.every(id=>id.startsWith('career-office-'))).toBe(true);
    expect(levelCounts('office',{},'nl','workplace').difficult).toBe(workplace.filter(c=>c.category==='office').length);
  });
  it('defaults old saved sessions to Everyday without changing their fixed deck or progress', () => {
    const old=createSessionFromIds({name:'Older session',cardIds:['food-07'],topic:'all',startingLevel:'difficult',now:NOW});
    const legacy=JSON.parse(JSON.stringify(old));delete legacy.collection;delete legacy.lang;
    const parsed=sessionSchema.parse(legacy);
    expect(parsed.collection).toBe('everyday');expect(parsed.lang).toBe('nl');
    expect(parsed.cards).toEqual(old.cards);expect(parsed.cardIds).toEqual(old.cardIds);
    expect(sessionSchema.safeParse({...fresh(),collection:'everyday'}).success).toBe(false);
    expect(sessionSchema.safeParse({...fresh(),lang:'fr'}).success).toBe(false);
    expect(practiseAgain(fresh()).collection).toBe('workplace');
  });
});
describe('existing learning rules on workplace content', () => {
  it('retains one fixed parent set and independently unlocks the existing ten-child family', () => {
    const s=fresh(), parents=[...s.cardIds];
    const enabled=run(s,{type:'variations/toggle',parentId:parents[0],enabled:true}).session;
    expect(enabled.cardIds).toEqual(parents);expect(enabled.study.order).toEqual(s.study.order);
    expect(enabled.variations[parents[0]].unlocked).toBe(2);
    expect(variationsFor(parents[0])).toHaveLength(10);
    expect(enabled.cards).toEqual(s.cards);
    expect(sessionSchema.safeParse(enabled).success).toBe(true);
  });
  it('reuses persisted model rotation, accepts a reviewed same-tile order, and scores an attempt only once', () => {
    const s=fresh(), card=cardFor('nl',s.cardIds[0])!, answers=communicationFor(card).answers;
    expect(answers).toHaveLength(2);
    const selected=answers[0],other=answers[1];
    const tokens=sentenceTokens(selected.text),used=new Set<number>();
    const order=sentenceTokens(other.text).map(word=>{const index=tokens.findIndex((token,i)=>token.toLowerCase()===word.toLowerCase()&&!used.has(i));used.add(index);return tokenId(index);});
    expect(matchAnswer(card,selected,order)?.id).toBe(other.id);
    const opened=run(s,{type:'quiz/open',cardId:card.id,attemptId:uid('attempt'),tokenOrder:tokens.map((_,i)=>tokenId(i)),rotateAnswers:true}).session;
    const saved=sessionSchema.parse(JSON.parse(JSON.stringify(opened)));
    expect(saved.quiz.current).toEqual(opened.quiz.current);
    const active=answers.find(a=>a.id===saved.quiz.current!.answerId)!;
    const action={type:'quiz/submit' as const,id:uid('submit'),at:NOW.toISOString(),attemptId:saved.quiz.current!.attemptId,answer:sentenceTokens(active.text).map((_,i)=>tokenId(i))};
    const result=applyAction(saved,action);expect(result.session.quiz.points).toBe(10);
    expect(applyAction(result.session,action).session.quiz.points).toBe(10);
    expect(result.session.cardIds).toEqual(s.cardIds);
  });
});
