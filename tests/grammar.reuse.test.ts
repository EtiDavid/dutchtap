import { describe, expect, it } from "vitest";
import { CARDS, CORE_CARDS, GRAMMAR_CARDS, GRAMMAR_REUSED_CARDS } from "@/lib/flashcards/engine";
import { breakdownFor } from "@/lib/grammarBreakdowns";
import { notesFor } from "@/lib/grammarNotes";
import { cardFor } from "@/lib/content/cards";
import { checkCreation, createSession, eligibleIds } from "@/lib/sessions/engine";
import { sessionSchema } from "@/lib/sessions/types";

describe("grammar reuse links", () => {
  it("preserves original content while using independent grammar ids and reviews", () => {
    const canonical = new Map(CORE_CARDS.map(c => [c.id,c]));
    for (const alias of GRAMMAR_REUSED_CARDS) {
      const original = canonical.get(alias.originCardId!);
      expect(original).toBeDefined();
      expect(alias.id).not.toBe(original!.id);
      expect(alias.collection).toBe("grammar");
      expect(alias.dutch).toBe(original!.dutch);
      expect(alias.english).toBe(original!.english);
      expect(alias.audio).toBe(original!.audio);
      expect(cardFor("nl", alias.id)?.text).toBe(original!.dutch);
      expect(notesFor(alias.id,"nl")).toBeDefined();
      expect(breakdownFor(alias.id,"nl")).toBeDefined();
    }
  });
  it("offers grammar sessions without modifying source-card global ratings", () => {
    expect(new Set(CARDS.map(c=>c.id)).size).toBe(CARDS.length);
    const aliases = GRAMMAR_REUSED_CARDS.filter(c=>c.category==="als");
    expect(aliases.length).toBe(23);
    const ratedCore: Record<string,any> = {};
    for (const c of aliases) ratedCore[c.originCardId!] = {id:c.originCardId!,level:"mastered"};
    const ids=eligibleIds("als","difficult",ratedCore,"nl","grammar");
    for(const alias of aliases) expect(ids).toContain(alias.id);
    const s=createSession({topic:"als",collection:"grammar",lang:"nl",count:10,level:"difficult",reviews:ratedCore,rand:()=>0.37});
    expect(s).not.toBeNull();
    if(s) expect(sessionSchema.safeParse(s).success).toBe(true);
    expect(checkCreation({topic:"als",collection:"grammar",count:10,level:"difficult"},ratedCore,0).ok).toBe(true);
  });
});
