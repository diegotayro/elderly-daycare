import { getAvatarTone } from "@/elderly/get-avatar-tone";
import type { Elderly, Room, UserRole } from "@/shared/database/types";
import type { AudienceElderlyOption, NewPostOptions } from "./types";

type NewPostOptionsSource = {
  role: UserRole;
  rooms: Room[];
  elderly: Elderly[]; // lo que el usuario ve por RLS: todos (admin) o sus asignados (staff)
};

export type BaseNewPostOptions = Omit<
  NewPostOptions,
  "roomsWithoutPhotoConsent"
>;

export function toAudienceElderlyOption(
  elderly: Pick<Elderly, "id" | "first_name" | "photo_consent">,
): AudienceElderlyOption {
  return {
    id: elderly.id,
    firstName: elderly.first_name,
    initial: elderly.first_name.charAt(0).toUpperCase(),
    tone: getAvatarTone(elderly.id),
    photoConsent: elderly.photo_consent,
  };
}

export function buildNewPostOptions(
  source: NewPostOptionsSource,
): BaseNewPostOptions {
  const isAdmin = source.role === "admin";
  const activeElderly = source.elderly.filter(
    (elderly) => elderly.status === "active",
  );
  const staffRoomIds = new Set(activeElderly.map((elderly) => elderly.room_id));
  const availableRooms = isAdmin
    ? source.rooms
    : source.rooms.filter((room) => staffRoomIds.has(room.id));

  return {
    elderly: activeElderly.map(toAudienceElderlyOption),
    rooms: availableRooms.map((room) => ({ id: room.id, name: room.name })),
    canPostToDaycare: isAdmin,
  };
}
