import {
  formatAge,
  formatBirthDate,
  formatEnrolledAt,
} from "./elderly-formatters";
import { getLinkedRelatives } from "./get-linked-relatives";
import type { ElderlyProfile, ElderlySource } from "./types";

export function buildElderlyProfile(
  source: ElderlySource,
  id: string,
): ElderlyProfile | null {
  const elderly = source.elderly.find((item) => item.id === id);
  const room = source.rooms.find((item) => item.id === elderly?.room_id);
  if (!elderly || !room) return null;

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
    enrolledAtLabel: formatEnrolledAt(elderly.enrolled_at),
    relatives: getLinkedRelatives(source, elderly.id),
    pendingInvitationEmails: source.invitations
      .filter(
        (invitation) =>
          invitation.elderly_id === elderly.id &&
          invitation.status === "pending",
      )
      .map((invitation) => invitation.email),
  };
}
