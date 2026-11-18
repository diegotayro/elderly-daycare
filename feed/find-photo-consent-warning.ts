import type { RoomOption } from "@/elderly/types";
import { newPostMessages as messages } from "./new-post-messages";
import type { AudienceSelection } from "./types";

type WarningOptions = {
  rooms: RoomOption[];
  roomsWithoutPhotoConsent: string[];
};

// Aviso genérico (sin nombres) para publicaciones de habitación o guardería con fotos
export function findPhotoConsentWarning(
  audience: AudienceSelection,
  photoCount: number,
  options: WarningOptions,
): string | null {
  if (photoCount === 0) return null;

  if (audience.kind === "room") {
    const room = options.rooms.find((option) => option.id === audience.roomId);
    const hasWithoutConsent = options.roomsWithoutPhotoConsent.includes(
      audience.roomId,
    );
    return room && hasWithoutConsent
      ? messages.photoConsentWarningRoom(room.name)
      : null;
  }

  if (audience.kind === "daycare") {
    return options.roomsWithoutPhotoConsent.length > 0
      ? messages.photoConsentWarningDaycare
      : null;
  }

  return null;
}
