import { describe,expect,it } from "vitest";
import { variationsFor,variationFor,variationCard,parentFor } from "@/lib/variations/content";
import { createSessionFromIds, progressOf } from "@/lib/sessions/engine";
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
});
