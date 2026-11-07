import { buildRoomOptions } from "@/elderly/build-room-options";
import type { ElderlySource } from "@/elderly/types";
import type { NewPostOptions } from "./types";

export function buildNewPostOptions(source: ElderlySource): NewPostOptions {
  return {
    elderly: source.elderly
      .filter((elderly) => elderly.status === "active")
      .map((elderly) => ({
        id: elderly.id,
        firstName: elderly.first_name,
        initial: elderly.first_name.charAt(0).toUpperCase(),
        tone: source.avatarTones[elderly.id] ?? "blue",
      })),
    rooms: buildRoomOptions(source),
  };
}
