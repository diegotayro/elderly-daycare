import { formatAge, formatRelativesCount } from "./elderly-formatters";
import { getLinkedRelatives } from "./get-linked-relatives";
import type { Elderly } from "@/shared/database/types";
import type {
  ElderlyIndicator,
  ElderlyList,
  ElderlyListItem,
  ElderlySource,
} from "./types";

type BuildElderlyListOptions = { includeArchived: boolean };

function resolveIndicator(
  elderly: Elderly,
  relativesCount: number,
): ElderlyIndicator {
  if (elderly.status === "archived") return { kind: "archived" };
  const [firstAllergy] = elderly.allergy_tags;
  if (firstAllergy)
    return { kind: "allergy", label: firstAllergy.toLocaleUpperCase("es") };
  if (relativesCount === 0) return { kind: "link" };
  return { kind: "none" };
}

function buildItem(source: ElderlySource, elderly: Elderly): ElderlyListItem {
  const relativesCount = getLinkedRelatives(source, elderly.id).length;
  return {
    id: elderly.id,
    fullName: elderly.full_name,
    initial: elderly.first_name[0],
    tone: source.avatarTones[elderly.id] ?? "blue",
    summary: `${formatAge(elderly.birth_date, source.referenceDate)} · ${formatRelativesCount(relativesCount)}`,
    indicator: resolveIndicator(elderly, relativesCount),
  };
}

export function buildElderlyList(
  source: ElderlySource,
  { includeArchived }: BuildElderlyListOptions,
): ElderlyList {
  const itemsWithStatus = (status: Elderly["status"]) =>
    source.elderly
      .filter((elderly) => elderly.status === status)
      .map((elderly) => buildItem(source, elderly));

  return {
    active: itemsWithStatus("active"),
    archived: includeArchived ? itemsWithStatus("archived") : [],
  };
}
