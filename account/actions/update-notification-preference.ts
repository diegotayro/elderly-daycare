"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { authorizeStaffAction } from "@/staff/actions/authorize-staff-action";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import {
  NOTIFICATION_PREFERENCE_KEYS,
  type NotificationPreferenceKey,
} from "../notification-preferences";
import type { NotificationPreferenceResult } from "../types";

function isPreferenceKey(key: unknown): key is NotificationPreferenceKey {
  return NOTIFICATION_PREFERENCE_KEYS.some((allowed) => allowed === key);
}

// Cada usuario cambia las suyas; el admin, las de un staff de su guardería que no esté archived
async function authorize(userId: string) {
  const caller = await getCurrentUser();
  if (!caller) return null;
  if (caller.id === userId) return createClient(await cookies());
  return authorizeStaffAction(userId, ["active", "pending"]);
}

// Estado deseado e idempotente: repetir la llamada no cambia el resultado
export async function updateNotificationPreference(
  userId: string,
  key: NotificationPreferenceKey,
  value: boolean,
): Promise<NotificationPreferenceResult> {
  const isValidInput =
    typeof userId === "string" &&
    isUuid(userId) &&
    isPreferenceKey(key) &&
    typeof value === "boolean";
  if (!isValidInput) return { status: "error" };

  const supabase = await authorize(userId);
  if (!supabase) return { status: "error" };

  const { data, error } = await supabase
    .from("users")
    .update({ [key]: value })
    .eq("id", userId)
    .select("id");
  // RLS actualiza 0 filas sin error
  if (error || data.length === 0) {
    console.error("updateNotificationPreference: no se pudo guardar", error);
    return { status: "error" };
  }

  refresh();
  return { status: "ok" };
}
