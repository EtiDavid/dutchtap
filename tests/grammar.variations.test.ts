import { describe,expect,it } from "vitest";
import { FAMILIES, variationsFor,variationFor,variationCard,parentFor } from "@/lib/variations/content";
import { GRAMMAR_CARDS } from "@/lib/flashcards/engine";
import { applyAction, availablePractice, createSessionFromIds, progressOf } from "@/lib/sessions/engine";
import { sessionSchema } from "@/lib/sessions/types";
describe("grammar interactive variations",()=>{
 for(const id of ["pat-als-01","pat-als-02","pat-als-03","pat-als-07","pat-als-14","pat-als-33","pat-als-60","pat-als-68","pat-als-72","pat-als-reuse-career-troubleshooting-029"]){
  it(`${id} has ten separate playable Dutch scenarios and per-child progress`,()=>{
   const children=variationsFor(id);
   expect(children).toHaveLength(10);
   expect(new Set(children.map(c=>c.text.toLocaleLowerCase("nl"))).size).toBe(10);
   const s=createSessionFromIds({topic:"als",collection:"grammar",cardIds:[id],name:"ALS",startingLevel:"difficult",lang:"nl"});
   for(const child of children){
    expect(child.explanation.length).toBeGreaterThan(30);
    expect(child.scenario.length).toBeGreaterThan(40);
    expect(parentFor(child.id)).toBe(id);
    expect(variationFor(child.id)?.id).toBe(child.id);
    expect(variationCard(child.id)?.scenarioNl).toBeTruthy();
    expect(progressOf(s,child.id).qCorrect).toBe(0);
   }
  });
 }
 it("exposes meaningful non-ALS grammar variations without padding families to ten",()=>{
  const grammarIds=new Set(GRAMMAR_CARDS.map(c=>c.id));
  const generated=Object.entries(FAMILIES).filter(([id,children])=>grammarIds.has(id)&&!id.startsWith("pat-als-")&&children.length>0);
  expect(generated.length).toBeGreaterThan(20);
  expect(new Set(generated.map(([id])=>GRAMMAR_CARDS.find(c=>c.id===id)!.category)).size).toBeGreaterThan(5);
  for(const [parentId,children] of generated){
    expect(children.length).toBeGreaterThanOrEqual(1);
    expect(children.length).toBeLessThanOrEqual(10);
    for(const child of children){
      expect(child.parentId).toBe(parentId);
      expect(child.scenarioNl).toBeTruthy();
      expect(child.explanation.length).toBeGreaterThan(30);
      expect(variationCard(child.id)?.text).toBe(child.text);
    }
  }
 });
 it("allows a one-child analysed family to be enabled and persisted",()=>{
  const grammarIds=new Set(GRAMMAR_CARDS.map(c=>c.id));
  const entry=Object.entries(FAMILIES).find(([id,children])=>grammarIds.has(id)&&!id.startsWith("pat-als-")&&children.length===1);
  expect(entry).toBeDefined();
  const [parentId,children]=entry!;
  const topic=GRAMMAR_CARDS.find(c=>c.id===parentId)!.category;
  let session=createSessionFromIds({topic,collection:"grammar",cardIds:[parentId],name:"Contrast practice",startingLevel:"difficult",lang:"nl"});
  const action={id:"var-toggle-0001",at:"2026-10-28T01:00:00.000Z",type:"variations/toggle" as const,parentId,enabled:true};
  const result=applyAction(session,action,new Date(action.at));
  expect(result.applied).toBe(true);
  session=result.session;
  expect(session.variations[parentId]).toMatchObject({enabled:true,unlocked:1});
  expect(availablePractice(session,"speaking")).toEqual([parentId,children[0].id]);
  expect(sessionSchema.safeParse(session).success).toBe(true);
 });
});