import { buildRoomOptions } from "./build-room-options";
import {
  formatAge,
  formatBirthDate,
  formatEnrolledAt,
} from "./elderly-formatters";
import { getLinkedRelatives } from "./get-linked-relatives";
import { toElderlyFormValues } from "./to-elderly-form-values";
import type { ElderlyProfile, ElderlySource } from "./types";

type BuildElderlyProfileOptions = { isAdmin: boolean };

export function buildElderlyProfile(
  source: ElderlySource,
  id: string,
  { isAdmin }: BuildElderlyProfileOptions,
): ElderlyProfile | null {
  const elderly = source.elderly.find((item) => item.id === id);
  const room = source.rooms.find((item) => item.id === elderly?.room_id);
  if (!elderly || !room) return null;
  const canEdit = isAdmin && elderly.status === "active";

  return {
    id: elderly.id,
    fullName: elderly.full_name,
    firstName: elderly.first_name,
    initial: elderly.first_name[0],
    tone: source.avatarTones[elderly.id] ?? "blue",
    subtitle: `${formatAge(elderly.birth_date, source.referenceDate)} · Habitación ${room.name}`,
    allergyTags: elderly.allergy_tags,
    medicalNotes: elderly.medical_notes,
    birthDateLabel: formatBirthDate(elderly.birth_date),
    roomName: room.name,
    isArchived: elderly.status === "archived",
    canLinkRelative: isAdmin && elderly.status === "active",
    photoConsent: elderly.photo_consent,
    canEditPhotoConsent: isAdmin && elderly.status === "active",
    canEdit,
    canArchive: canEdit,
    canReactivate: isAdmin && elderly.status === "archived",
    editValues: toElderlyFormValues(elderly),
    today: source.referenceDate,
    roomOptions: canEdit ? buildRoomOptions(source) : [],
    enrolledAtLabel: formatEnrolledAt(elderly.enrolled_at),
    relatives: getLinkedRelatives(source, elderly.id, { isAdmin }),
    pendingInvitationEmails: source.invitations
      .filter(
        (invitation) =>
          invitation.elderly_id === elderly.id &&
          invitation.status === "pending",
      )
      .map((invitation) => invitation.email),
  };
}
