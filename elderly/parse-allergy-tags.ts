import { normalizeSearch } from "@/shared/text/normalize-search";

export function parseAllergyTags(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (tag === "") return false;
      const key = normalizeSearch(tag);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
