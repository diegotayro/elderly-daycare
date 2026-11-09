import "server-only";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import type { Elderly, Room } from "@/shared/database/types";
import { getAvatarTone } from "./get-avatar-tone";
import type { ElderlySource } from "./types";

export async function getElderlySource(): Promise<ElderlySource> {
  // La fecha de hoy debe quedar fuera del prerender
  await io();

  const supabase = createClient(await cookies());
  const [elderlyResult, roomsResult] = await Promise.all([
    supabase.from("elderly").select("*").order("full_name"),
    supabase.from("rooms").select("*").order("name"),
  ]);
  if (elderlyResult.error) throw elderlyResult.error;
  if (roomsResult.error) throw roomsResult.error;

  const elderly: Elderly[] = elderlyResult.data;
  const rooms: Room[] = roomsResult.data;

  return {
    referenceDate: getLimaToday(),
    rooms,
    elderly,
    // Aún no existen guardian_elderly ni invitations: cero familiares
    relatives: [],
    guardianElderly: [],
    invitations: [],
    avatarTones: Object.fromEntries(
      elderly.map(({ id }) => [id, getAvatarTone(id)]),
    ),
  };
}
