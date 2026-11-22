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
import { signAvatarUrls } from "@/users/sign-avatar-urls";
import { buildAvatarTones } from "./build-avatar-tones";
import { fetchStaffEmails } from "./fetch-staff-emails";
import type { StaffProfileSource } from "./types";

// Vínculos de esos adultos mayores con otros staff en estado active
async function fetchOtherActiveLinks(
  supabase: ReturnType<typeof createClient>,
  staffId: string,
  elderlyIds: string[],
): Promise<StaffElderly[]> {
  if (elderlyIds.length === 0) return [];

  const linksResult = await supabase
    .from("staff_elderly")
    .select("*")
    .in("elderly_id", elderlyIds)
    .neq("staff_id", staffId);
  if (linksResult.error) throw linksResult.error;
  const links: StaffElderly[] = linksResult.data;
  if (links.length === 0) return [];

  const activeStaffResult = await supabase
    .from("users")
    .select("id")
    .eq("role", "staff")
    .eq("status", "active")
    .in("id", [...new Set(links.map((link) => link.staff_id))]);
  if (activeStaffResult.error) throw activeStaffResult.error;
  const activeIds = new Set(
    (activeStaffResult.data as { id: string }[]).map((row) => row.id),
  );

  return links.filter((link) => activeIds.has(link.staff_id));
}

// React cache evita consultar dos veces entre generateMetadata y la página
export const getStaffProfileSource = cache(
  async (id: string): Promise<StaffProfileSource | null> => {
    if (!isUuid(id)) return null;

    // La fecha de hoy debe quedar fuera del prerender
    await io();

    const supabase = createClient(await cookies());
    const [staffResult, linksResult, emails, historyResult] = await Promise.all(
      [
        supabase
          .from("users")
          .select("*")
          .eq("role", "staff")
          .eq("id", id)
          .maybeSingle(),
        supabase.from("staff_elderly").select("*").eq("staff_id", id),
        fetchStaffEmails(supabase),
        supabase.rpc("staff_has_history", { p_staff_id: id }),
      ],
    );
    if (staffResult.error) throw staffResult.error;
    if (linksResult.error) throw linksResult.error;
    if (historyResult.error) throw historyResult.error;

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

    const otherActiveLinks = await fetchOtherActiveLinks(
      supabase,
      id,
      linkedIds,
    );

    const staff = [{ ...user, email }];
    const elderly: Elderly[] = elderlyResult.data;
    const rooms: Room[] = roomsResult.data;

    return {
      referenceDate: getLimaToday(),
      staff,
      elderly,
      rooms,
      staffElderly,
      hasHistory: historyResult.data === true,
      otherActiveLinks,
      avatarTones: buildAvatarTones([...staff, ...elderly]),
      avatarUrls: await signAvatarUrls(staff),
    };
  },
);
