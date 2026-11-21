import type { FamilyPost } from "./types";

const listFormatter = new Intl.ListFormat("es", { type: "conjunction" });

// "Habitación Roble · Luis y Carmen": cuáles de sus adultos mayores están en la habitación
export function buildRoomLine({
  roomName,
  roomElderlyNames,
}: Pick<FamilyPost, "roomName" | "roomElderlyNames">): string {
  const room = `Habitación ${roomName ?? ""}`.trim();
  return roomElderlyNames.length > 0
    ? `${room} · ${listFormatter.format(roomElderlyNames)}`
    : room;
}
