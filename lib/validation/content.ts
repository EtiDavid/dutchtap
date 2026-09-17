import { NOUN_CATEGORIES, type AdjectiveEntry, type NounEntry } from "@/data/types";

export type ContentValidationError = {
  entryId: string;
  field: string;
  message: string;
};

export type ContentValidationResult = {
  valid: boolean;
  errors: ContentValidationError[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateNouns(nouns: NounEntry[]): ContentValidationResult {
  const errors: ContentValidationError[] = [];
  const seenIds = new Set<string>();

  for (const noun of nouns) {
    const label = noun.id ?? noun.singular ?? "(unknown)";

    if (!isNonEmptyString(noun.id)) {
      errors.push({ entryId: label, field: "id", message: "Missing unique id" });
    } else if (seenIds.has(noun.id)) {
      errors.push({ entryId: noun.id, field: "id", message: "Duplicate id" });
    } else {
      seenIds.add(noun.id);
    }

    if (!isNonEmptyString(noun.singular)) {
      errors.push({ entryId: label, field: "singular", message: "Missing singular form" });
    }
    if (noun.article !== "de" && noun.article !== "het") {
      errors.push({ entryId: label, field: "article", message: `Invalid article: ${String(noun.article)}` });
    }
    if (!isNonEmptyString(noun.plural)) {
      errors.push({ entryId: label, field: "plural", message: "Missing plural form" });
    }
    if (!isNonEmptyString(noun.englishSingular)) {
      errors.push({ entryId: label, field: "englishSingular", message: "Missing English meaning" });
    }
    if (!isNonEmptyString(noun.englishPlural)) {
      errors.push({ entryId: label, field: "englishPlural", message: "Missing English plural meaning" });
    }
    if (!NOUN_CATEGORIES.includes(noun.category)) {
      errors.push({ entryId: label, field: "category", message: `Invalid category: ${String(noun.category)}` });
    }
    if (noun.level !== "A1" && noun.level !== "A2") {
      errors.push({ entryId: label, field: "level", message: `Invalid level: ${String(noun.level)}` });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateAdjectives(adjectives: AdjectiveEntry[]): ContentValidationResult {
  const errors: ContentValidationError[] = [];
  const seenIds = new Set<string>();

  for (const adjective of adjectives) {
    const label = adjective.id ?? adjective.base ?? "(unknown)";

    if (!isNonEmptyString(adjective.id)) {
      errors.push({ entryId: label, field: "id", message: "Missing unique id" });
    } else if (seenIds.has(adjective.id)) {
      errors.push({ entryId: adjective.id, field: "id", message: "Duplicate id" });
    } else {
      seenIds.add(adjective.id);
    }

    if (!isNonEmptyString(adjective.base)) {
      errors.push({ entryId: label, field: "base", message: "Missing base form" });
    }
    if (!isNonEmptyString(adjective.eForm)) {
      errors.push({ entryId: label, field: "eForm", message: "Missing -e form" });
    }
    if (!isNonEmptyString(adjective.english)) {
      errors.push({ entryId: label, field: "english", message: "Missing English meaning" });
    }
    if (adjective.allowedCategories) {
      for (const category of adjective.allowedCategories) {
        if (!NOUN_CATEGORIES.includes(category)) {
          errors.push({ entryId: label, field: "allowedCategories", message: `Invalid category: ${String(category)}` });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
