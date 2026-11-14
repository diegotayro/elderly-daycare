import "server-only";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { getLimaToday } from "@/shared/date/get-lima-today";
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

export async function getStaffSource(): Promise<StaffSource> {
  // La fecha de hoy debe quedar fuera del prerender
  await io();

  const supabase = createClient(await cookies());
  const [staffResult, linksResult, elderlyResult, roomsResult, emails] =
    await Promise.all([
      supabase.from("users").select("*").eq("role", "staff").order("full_name"),
      supabase.from("staff_elderly").select("*"),
      supabase.from("elderly").select("*"),
      supabase.from("rooms").select("*"),
      fetchStaffEmails(supabase),
    ]);
  if (staffResult.error) throw staffResult.error;
  if (linksResult.error) throw linksResult.error;
  if (elderlyResult.error) throw elderlyResult.error;
  if (roomsResult.error) throw roomsResult.error;

  const users: User[] = staffResult.data;
  const staff = users.map((user) => ({
    ...user,
    email: emails.get(user.id) ?? "",
  }));
  const elderly: Elderly[] = elderlyResult.data;
  const rooms: Room[] = roomsResult.data;
  const staffElderly: StaffElderly[] = linksResult.data;

  return {
    referenceDate: getLimaToday(),
    staff,
    elderly,
    rooms,
    staffElderly,
    avatarTones: buildAvatarTones([...staff, ...elderly]),
  };
}
