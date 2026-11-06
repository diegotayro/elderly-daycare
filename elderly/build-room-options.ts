import type { ElderlySource, RoomOption } from "./types";

export function buildRoomOptions(source: ElderlySource): RoomOption[] {
  return source.rooms.map((room) => ({ id: room.id, name: room.name }));
}
