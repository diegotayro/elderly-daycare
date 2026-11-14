import "server-only";
import { cache } from "react";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { isUuid } from "@/shared/text/is-uuid";
import { createClient } from "@/shared/supabase/server";
import type {
  Elderly,
  Room,
  StaffElderly,
  User,
} from "@/shared/database/types";
import { buildAvatarTones } from "./build-avatar-tones";
import { fetchStaffEmails } from "./fetch-staff-emails";
import type { StaffSource } from "./types";

// React cache evita consultar dos veces entre generateMetadata y la página
export const getStaffProfileSource = cache(
  async (id: string): Promise<StaffSource | null> => {
    if (!isUuid(id)) return null;

    // La fecha de hoy debe quedar fuera del prerender
    await io();

    const supabase = createClient(await cookies());
    const [staffResult, linksResult, emails] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .eq("role", "staff")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("staff_elderly").select("*").eq("staff_id", id),
      fetchStaffEmails(supabase),
    ]);
    if (staffResult.error) throw staffResult.error;
    if (linksResult.error) throw linksResult.error;

    const user: User | null = staffResult.data;
    const email = emails.get(id);
    if (!user || email === undefined) return null;
    const staffElderly: StaffElderly[] = linksResult.data;

    // Activos para el selector, más los vinculados (incluso archivados)
    const linkedIds = staffElderly.map((link) => link.elderly_id);
    const elderlyFilter =
      linkedIds.length > 0
        ? `status.eq.active,id.in.(${linkedIds.join(",")})`
        : "status.eq.active";
    const [elderlyResult, roomsResult] = await Promise.all([
      supabase.from("elderly").select("*").or(elderlyFilter),
      supabase.from("rooms").select("*"),
    ]);
    if (elderlyResult.error) throw elderlyResult.error;
    if (roomsResult.error) throw roomsResult.error;

    const staff = [{ ...user, email }];
    const elderly: Elderly[] = elderlyResult.data;
    const rooms: Room[] = roomsResult.data;

    return {
      referenceDate: getLimaToday(),
      staff,
      elderly,
      rooms,
      staffElderly,
      avatarTones: buildAvatarTones([...staff, ...elderly]),
    };
  },
);
