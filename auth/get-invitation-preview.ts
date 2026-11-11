import "server-only";
import { getAvatarTone } from "@/elderly/get-avatar-tone";
import { createAdminClient } from "@/shared/supabase/admin";
import type { InvitationPreview } from "./types";

type InvitationPreviewRow = {
  email: string;
  first_name: string;
  last_name: string;
  elderly_full_name: string;
  elderly_first_name: string;
  elderly_id: string;
  room_name: string;
  daycare_id: string;
  has_account: boolean;
};

// Datos completos para el servidor (activación); no se envían al cliente
export type InvitationPreviewRecord = {
  code: string;
  email: string;
  firstName: string;
  lastName: string;
  elderlyId: string;
  elderlyFullName: string;
  elderlyFirstName: string;
  roomName: string;
  daycareId: string;
  hasAccount: boolean;
};

export function normalizeInvitationCode(code: string): string {
  return code.replace(/\s/g, "").toUpperCase();
}

// null = código inexistente, vencido, usado o de un adulto mayor archivado
export async function getInvitationPreview(
  code: string | undefined,
): Promise<InvitationPreviewRecord | null> {
  if (!code) return null;
  const normalizedCode = normalizeInvitationCode(code);

  const { data, error } = await createAdminClient().rpc(
    "get_invitation_preview",
    { p_code: normalizedCode },
  );
  if (error) throw error;

  const [row] = data as InvitationPreviewRow[];
  if (!row) return null;

  return {
    code: normalizedCode,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    elderlyId: row.elderly_id,
    elderlyFullName: row.elderly_full_name,
    elderlyFirstName: row.elderly_first_name,
    roomName: row.room_name,
    daycareId: row.daycare_id,
    hasAccount: row.has_account,
  };
}

// Lo que llega al cliente: sin daycare_id ni elderly_id
export function toInvitationPreview(
  record: InvitationPreviewRecord,
): InvitationPreview {
  return {
    code: record.code,
    email: record.email,
    elderlyFullName: record.elderlyFullName,
    elderlyInitial: record.elderlyFullName[0],
    elderlyTone: getAvatarTone(record.elderlyId),
    roomName: record.roomName,
    hasAccount: record.hasAccount,
  };
}
