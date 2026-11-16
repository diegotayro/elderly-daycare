import type { StaffElderly } from "@/shared/database/types";
import type { LinkedElderly } from "./types";

// Nombres de los adultos mayores activos que se quedarían sin otro staff activo.
export function getUncoveredElderly(
  linkedElderly: LinkedElderly[],
  otherActiveLinks: StaffElderly[],
): string[] {
  const coveredIds = new Set(otherActiveLinks.map((link) => link.elderly_id));
  return linkedElderly
    .filter(
      (item) => item.status === "active" && !coveredIds.has(item.elderlyId),
    )
    .map((item) => item.fullName);
}
