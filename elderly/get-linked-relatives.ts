import type { AvatarTone } from "./avatar-tones";
import {
  pendingRelativeLabels,
  relationshipLabels,
} from "./relationship-labels";
import type { ElderlySource, LinkedRelative } from "./types";

const DEFAULT_RELATIVE_TONE: AvatarTone = "lilac";

// Familiares vinculados = vínculos activos + invitaciones pendientes.
export function getLinkedRelatives(
  source: ElderlySource,
  elderlyId: string,
): LinkedRelative[] {
  const toneOf = (id: string) =>
    source.avatarTones[id] ?? DEFAULT_RELATIVE_TONE;

  const active = source.guardianElderly
    .filter((link) => link.elderly_id === elderlyId)
    .flatMap((link) => {
      const relative = source.relatives.find(
        ({ id }) => id === link.relative_id,
      );
      if (!relative) return [];
      const labels = relationshipLabels[link.relationship];
      return [
        {
          id: link.id,
          fullName: relative.full_name,
          initial: relative.first_name[0],
          tone: toneOf(relative.id),
          detail: `${labels.label} · ${labels.activeDetail}`,
          status: "active" as const,
          statusLabel: labels.activeBadge,
        },
      ];
    });

  const pending = source.invitations
    .filter(
      (invitation) =>
        invitation.elderly_id === elderlyId && invitation.status === "pending",
    )
    .map((invitation) => ({
      id: invitation.id,
      fullName: invitation.full_name,
      initial: invitation.first_name[0],
      tone: toneOf(invitation.id),
      detail: `${relationshipLabels[invitation.relationship].label} · ${pendingRelativeLabels.detail}`,
      status: "pending" as const,
      statusLabel: pendingRelativeLabels.badge,
    }));

  return [...active, ...pending];
}
