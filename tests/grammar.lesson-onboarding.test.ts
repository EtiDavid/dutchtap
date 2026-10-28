import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import lessons from "@/data/grammar-topic-lessons.json";
import { GrammarTopicLesson } from "@/components/sessions/GrammarTopicLesson";

describe("Grammar Mastery: learn before recall", () => {
  const expanded = ["inversion", "omdat", "dat", "verbs"] as const;
  it("provides a complete stepwise study guide for essential word order and verb choice", () => {
    for (const topic of expanded) {
      const lesson = lessons[topic];
      expect(lesson.revision).toMatch(/^1\.[01]$/);
      expect(lesson.sections.length, topic).toBeGreaterThanOrEqual(5);
      expect(lesson.formulas.length, topic).toBeGreaterThanOrEqual(3);
      expect(lesson.mistakes.length, topic).toBeGreaterThanOrEqual(3);
      expect(lesson.status, topic).toMatch(/not independently reviewed/i);
      for (const section of lesson.sections) {
        expect(section.body.length, `${topic}: ${section.title}`).toBeGreaterThan(90);
        expect(section.examples.length).toBeGreaterThanOrEqual(3);
        for (const example of section.examples) {
          expect(example.nl.length).toBeGreaterThan(8);
          expect(example.en.length).toBeGreaterThan(5);
        }
      }
      for (const mistake of lesson.mistakes) {
        expect(mistake.wrong).not.toBe(mistake.right);
        expect(mistake.why.length).toBeGreaterThan(60);
      }
    }
  });
  it("explains English 'have to' versus Dutch moeten, hoeven and completed actions", () => {
    const examples = lessons.verbs.sections.flatMap(s => s.examples.map(x => x.nl));
    expect(examples).toContain("Ik moet vandaag werken.");
    expect(examples).toContain("Ik hoef morgen niet te werken.");
    expect(examples).toContain("Ik heb de afwas gedaan.");
    expect(lessons.verbs.mistakes.some(x => x.wrong === "Ik heb niets doen." && x.right === "Ik hoef niets te doen.")).toBe(true);
  });
  it("shows the topic lesson on entering Study, but closes it by default for self-recall", () => {
    const study = renderToStaticMarkup(createElement(GrammarTopicLesson, { topic: "als", defaultOpen: true }));
    const speaking = renderToStaticMarkup(createElement(GrammarTopicLesson, { topic: "als", defaultOpen: false }));
    expect(study).toMatch(/<details[^>]*open=""/);
    expect(speaking).not.toMatch(/<details[^>]*open=""/);
    expect(study).toContain("Learn the rule");
    expect(study).toContain("ALS — if, when and whenever");
  });
});
