import type { AvatarTone } from "./avatar-tones";
import {
  pendingRelativeLabels,
  relationshipLabels,
} from "./relationship-labels";
import type { ElderlySource, LinkedRelative } from "./types";

const DEFAULT_RELATIVE_TONE: AvatarTone = "lilac";

// Familiares vinculados = vínculos activos + invitaciones pendientes.
// Con `isAdmin`, cada vínculo activo enlaza al perfil del familiar, que recuerda desde qué adulto mayor se entró.
export function getLinkedRelatives(
  source: ElderlySource,
  elderlyId: string,
  { isAdmin = false }: { isAdmin?: boolean } = {},
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
          photoUrl: source.avatarUrls[relative.id] ?? null,
          profileHref: isAdmin
            ? `/relatives/${relative.id}?from=${elderlyId}`
            : null,
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
      photoUrl: null,
      profileHref: null,
      detail: `${relationshipLabels[invitation.relationship].label} · ${pendingRelativeLabels.detail}`,
      status: "pending" as const,
      statusLabel: pendingRelativeLabels.badge,
    }));

  return [...active, ...pending];
}
