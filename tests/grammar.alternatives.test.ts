import { describe,expect,it } from "vitest";
import exp from "@/data/editorial/grammar-als-expansion.json";
import { cardFor } from "@/lib/content/cards";
import { communicationFor,matchAnswer,modelFor,principalAnswers } from "@/lib/practice/communication";
import { sentenceTokens,tokenId } from "@/lib/sessions/wordOrder";
describe("ALS alternative clause orders",()=>{
 it("offers both clause orders without leaking a mandatory first-clause hint",()=>{
  expect(exp).toHaveLength(58);
  for(let i=0;i<exp.length;i++){
    const c=cardFor("nl",`pat-als-${String(20+i).padStart(2,"0")}`)!;
    const models=principalAnswers(communicationFor(c));
    expect(models).toHaveLength(2);
    expect(models[0].id).toBe("model");
    expect(models[0].text).toBe(c.text);
    expect(models[1].id).toBe("clause-order");
    expect(models[1].text).toBe(exp[i%2===0?i+1:i-1].dutch);
    expect(c.scenario).not.toMatch(/Start with/i);
    expect(c.scenarioNl).not.toMatch(/Begin met/i);
    expect(models.map(m=>m.english)).toEqual([c.english,c.english]);
    const first=modelFor(c)!;
    const second=modelFor(c,"clause-order")!;
    expect(first.text).not.toBe(second.text);
    expect(sentenceTokens(first.text).length).toBe(sentenceTokens(second.text).length);
  }
 });
 it("accepts the alternate ordering when built with the same word tiles",()=>{
  const c=cardFor("nl","pat-als-20")!;
  const selected=modelFor(c)!;
  const alt=modelFor(c,"clause-order")!;
  const source=sentenceTokens(selected.text);
  const words=sentenceTokens(alt.text);
  const used=new Set<number>();
  const tokens=words.map(w=>{
    const j=source.findIndex((item,i)=>item===w && !used.has(i));
    if(j<0)throw Error("Missing token "+w);
    used.add(j);return tokenId(j);
  });
  expect(matchAnswer(c,selected,tokens)?.id).toBe("clause-order");
 });
});
