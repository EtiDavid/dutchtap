import { describe, it, expect } from "vitest";
import { CARDS, GRAMMAR_CARDS } from "@/lib/flashcards/engine";
import { checkCreation, createSession, eligibleIds } from "@/lib/sessions/engine";
import { notesFor } from "@/lib/grammarNotes";
import { cardFor } from "@/lib/content/cards";
import { sessionSchema } from "@/lib/sessions/types";
import expansion from "@/data/editorial/grammar-als-expansion.json";
import lessons from "@/data/grammar-topic-lessons.json";
describe("ALS vertical-slice content",()=>{
 it("offers precisely 100 distinct playable ALS base cards with stable original ids",()=>{
  const als=GRAMMAR_CARDS.filter(c=>c.category==="als");
  expect(als.length).toBe(100);
  expect(new Set(als.map(c=>c.id)).size).toBe(100);
  expect(new Set(als.map(c=>c.dutch.toLocaleLowerCase("nl"))).size).toBe(100);
  for(let i=1;i<=19;i++) expect(als.some(c=>c.id===`pat-als-${String(i).padStart(2,"0")}`)).toBe(true);
  expect(expansion).toHaveLength(58);
  expect(als.filter(c=>c.originCardId)).toHaveLength(23);
 });
 it("does not duplicate or change the original 1200 Core cards",()=>{
  const core=CARDS.filter(c=>c.collection!=="grammar");
  expect(core).toHaveLength(1200);
  expect(new Set(core.map(c=>c.id)).size).toBe(1200);
 });
 it("retains authentic situations, bilingual prompts and individual why explanations",()=>{
  for(const card of GRAMMAR_CARDS.filter(c=>c.category==="als"&&c.id.startsWith("pat-als-")&&!c.originCardId).slice(19)){
    const c=cardFor("nl",card.id)!;
    expect(c.scenarioNl?.length).toBeGreaterThan(30);
    expect(c.scenario.length).toBeGreaterThan(35);
    expect(card.grammar.length).toBeGreaterThan(50);
    expect(notesFor(card.id,"nl")?.examples.length).toBeGreaterThanOrEqual(10);
  }
  expect(lessons.als.sections.length).toBeGreaterThanOrEqual(7);
  expect(lessons.als.mistakes.length).toBeGreaterThanOrEqual(2);
 });
 it("selects 100 ALS difficult cards as a fixed valid session without exceeding limits",()=>{
  const ids=eligibleIds("als","difficult",{},"nl","grammar");
  expect(ids).toHaveLength(100);
  expect(checkCreation({topic:"als",collection:"grammar",count:100,level:"difficult"}, {},0).ok).toBe(true);
  const s=createSession({topic:"als",collection:"grammar",lang:"nl",count:100,level:"difficult",reviews:{},rand:()=>0.42});
  expect(s).toBeTruthy();
  if(s){expect(new Set(s.cardIds).size).toBe(100);expect(sessionSchema.safeParse(s).success).toBe(true);}
 });
});
