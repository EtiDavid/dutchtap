import {expect,describe,it} from "vitest";
import lessons from "@/data/grammar-topic-lessons.json";
describe("topic-level error-correction content",()=>{
 it("provides actionable wrong, right and why examples for each active topic",()=>{
  for(const [key,lesson] of Object.entries(lessons)){
   expect(lesson.mistakes.length,key).toBeGreaterThanOrEqual(1);
   for(const m of lesson.mistakes){
    expect(m.wrong.length,key).toBeGreaterThan(12);
    expect(m.right.length,key).toBeGreaterThan(12);
    expect(m.why.length,key).toBeGreaterThan(30);
    expect(m.wrong,key).not.toBe(m.right);
   }
  }
 });
});
