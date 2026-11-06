import type { ElderlySource } from "@/elderly/types";
import type { InvitationPreview } from "./types";

const DEFAULT_ELDERLY_TONE = "blue";

function normalizeCode(code: string): string {
  return code.replace(/\s/g, "").toUpperCase();
}

export function findInvitationPreview(
  source: ElderlySource,
  code: string | undefined,
): InvitationPreview | null {
  if (!code) return null;

  const normalizedCode = normalizeCode(code);
  const invitation = source.invitations.find(
    (candidate) => candidate.code === normalizedCode,
  );
  if (!invitation) return null;

  const isPending = invitation.status === "pending";
  const isExpired =
    invitation.expires_at.slice(0, 10) <= source.referenceDate;
  if (!isPending || isExpired) return null;

  const elderly = source.elderly.find(({ id }) => id === invitation.elderly_id);
  const room = source.rooms.find(({ id }) => id === elderly?.room_id);
  if (!elderly || !room) return null;

  return {
    code: invitation.code,
    email: invitation.email,
    elderlyFullName: elderly.full_name,
    elderlyInitial: elderly.first_name[0],
    elderlyTone: source.avatarTones[elderly.id] ?? DEFAULT_ELDERLY_TONE,
    roomName: room.name,
  };
}
