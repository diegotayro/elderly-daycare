import "server-only";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import type { Elderly, Room } from "@/shared/database/types";
import { fetchPendingInvitations } from "./fetch-pending-invitations";
import { fetchRelativeLinks } from "./fetch-relative-links";
import { getAvatarTone } from "./get-avatar-tone";
import type { ElderlySource } from "./types";

export async function getElderlySource(): Promise<ElderlySource> {
  // La fecha de hoy debe quedar fuera del prerender
  await io();

  const supabase = createClient(await cookies());
  const [
    elderlyResult,
    roomsResult,
    { guardianElderly, relatives },
    invitations,
  ] = await Promise.all([
      supabase.from("elderly").select("*").order("full_name"),
      supabase.from("rooms").select("*").order("name"),
      fetchRelativeLinks(supabase),
      fetchPendingInvitations(supabase),
    ]);
  if (elderlyResult.error) throw elderlyResult.error;
  if (roomsResult.error) throw roomsResult.error;

  const elderly: Elderly[] = elderlyResult.data;
  const rooms: Room[] = roomsResult.data;

  return {
    referenceDate: getLimaToday(),
    rooms,
    elderly,
    relatives,
    guardianElderly,
    invitations,
    avatarTones: Object.fromEntries(
      [...elderly, ...relatives].map(({ id }) => [id, getAvatarTone(id)]),
    ),
  };
}
