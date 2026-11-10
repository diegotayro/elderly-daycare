import { formatAge, formatRelativesCount } from "./elderly-formatters";
import { getLinkedRelatives } from "./get-linked-relatives";
import type { Elderly } from "@/shared/database/types";
import type { ElderlyIndicator, ElderlyListItem, ElderlySource } from "./types";

function resolveIndicator(
  elderly: Elderly,
  relativesCount: number,
): ElderlyIndicator {
  const [firstAllergy] = elderly.allergy_tags;
  if (firstAllergy)
    return { kind: "allergy", label: firstAllergy.toLocaleUpperCase("es") };
  if (relativesCount === 0) return { kind: "link" };
  return { kind: "none" };
}

export function buildElderlyList(source: ElderlySource): ElderlyListItem[] {
  return source.elderly
    .filter((elderly) => elderly.status === "active")
    .map((elderly) => {
      const relativesCount = getLinkedRelatives(source, elderly.id).length;
      return {
        id: elderly.id,
        fullName: elderly.full_name,
        initial: elderly.first_name[0],
        tone: source.avatarTones[elderly.id] ?? "blue",
        summary: `${formatAge(elderly.birth_date, source.referenceDate)} · ${formatRelativesCount(relativesCount)}`,
        indicator: resolveIndicator(elderly, relativesCount),
      };
    });
}
