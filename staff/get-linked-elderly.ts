import type { Elderly } from "@/shared/database/types";
import type { StaffSource } from "./types";

// Adultos mayores vinculados al staff, con su fila de vínculo, por fecha de vínculo.
export function getLinkedElderlyRows(
  source: StaffSource,
  staffId: string,
): { linkId: string; elderly: Elderly }[] {
  return source.staffElderly
    .filter((link) => link.staff_id === staffId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .flatMap((link) => {
      const elderly = source.elderly.find(
        (item) => item.id === link.elderly_id,
      );
      return elderly ? [{ linkId: link.id, elderly }] : [];
    });
}
