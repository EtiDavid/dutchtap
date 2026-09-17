import type { NounEntry } from "@/data/types";
import type { Demonstrative, Distance } from "./types";

/**
 * Singular de-word:  near -> deze, far -> die
 * Singular het-word: near -> dit,  far -> dat
 * Plural (any noun): near -> deze, far -> die
 */
export function getDemonstrativeAnswer(
  noun: NounEntry,
  distance: Distance,
  isPlural: boolean,
): Demonstrative {
  if (isPlural) {
    return distance === "near" ? "deze" : "die";
  }

  if (noun.article === "de") {
    return distance === "near" ? "deze" : "die";
  }

  return distance === "near" ? "dit" : "dat";
}
