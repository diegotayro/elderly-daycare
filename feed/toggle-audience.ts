import type { AudienceChip, AudienceSelection } from "./types";

function toggleElderly(
  current: AudienceSelection,
  elderlyId: string,
): AudienceSelection {
  const selectedIds = current.kind === "elderly" ? current.elderlyIds : [];
  const nextIds = selectedIds.includes(elderlyId)
    ? selectedIds.filter((id) => id !== elderlyId)
    : [...selectedIds, elderlyId];

  return nextIds.length === 0
    ? { kind: "none" }
    : { kind: "elderly", elderlyIds: nextIds };
}

export function toggleAudience(
  current: AudienceSelection,
  chip: AudienceChip,
  defaultRoomId: string,
): AudienceSelection {
  switch (chip.kind) {
    case "elderly":
      return toggleElderly(current, chip.elderlyId);
    case "room":
      return current.kind === "room"
        ? { kind: "none" }
        : { kind: "room", roomId: defaultRoomId };
    case "daycare":
      return current.kind === "daycare" ? { kind: "none" } : { kind: "daycare" };
  }
}
