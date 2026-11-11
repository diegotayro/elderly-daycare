import "server-only";
import { cache } from "react";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { isUuid } from "@/shared/text/is-uuid";
import { createClient } from "@/shared/supabase/server";
import type { Elderly, Room } from "@/shared/database/types";
import { fetchPendingInvitations } from "./fetch-pending-invitations";
import { fetchRelativeLinks } from "./fetch-relative-links";
import { getAvatarTone } from "./get-avatar-tone";
import type { ElderlySource } from "./types";

// React cache evita consultar dos veces entre generateMetadata y la página
export const getElderlyProfileSource = cache(
  async (id: string): Promise<ElderlySource | null> => {
    if (!isUuid(id)) return null;

    // La fecha de hoy debe quedar fuera del prerender
    await io();

    const supabase = createClient(await cookies());
    const elderlyResult = await supabase
      .from("elderly")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (elderlyResult.error) throw elderlyResult.error;
    if (!elderlyResult.data) return null;
    const elderly: Elderly = elderlyResult.data;

    const [roomResult, { guardianElderly, relatives }, invitations] =
      await Promise.all([
      supabase.from("rooms").select("*").eq("id", elderly.room_id),
        fetchRelativeLinks(supabase, [id]),
        fetchPendingInvitations(supabase, [id]),
      ]);
    if (roomResult.error) throw roomResult.error;
    const rooms: Room[] = roomResult.data;

    return {
      referenceDate: getLimaToday(),
      rooms,
      elderly: [elderly],
      relatives,
      guardianElderly,
      invitations,
      avatarTones: Object.fromEntries(
        [elderly, ...relatives].map(({ id }) => [id, getAvatarTone(id)]),
      ),
    };
  },
);
