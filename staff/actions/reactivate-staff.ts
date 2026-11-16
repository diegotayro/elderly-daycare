"use server";

import { refresh } from "next/cache";
import { createAdminClient } from "@/shared/supabase/admin";
import { STAFF_BAN_DURATION } from "../staff-ban-duration";
import type { StaffActionResult } from "../types";
import { authorizeStaffAction } from "./authorize-staff-action";

export async function reactivateStaff(
  staffId: string,
): Promise<StaffActionResult> {
  const supabase = await authorizeStaffAction(staffId, ["archived"]);
  if (!supabase) return { status: "error" };

  const auth = createAdminClient().auth.admin;
  const { error: unbanError } = await auth.updateUserById(staffId, {
    ban_duration: "none",
  });
  if (unbanError) {
    console.error("reactivateStaff: no se pudo quitar el bloqueo", unbanError);
    return { status: "error" };
  }

  const { data, error } = await supabase
    .from("users")
    .update({ status: "active" })
    .eq("id", staffId)
    .eq("status", "archived")
    .select("id");
  if (error || data.length === 0) {
    console.error("reactivateStaff: no se pudo reactivar", error);
    const { error: banError } = await auth.updateUserById(staffId, {
      ban_duration: STAFF_BAN_DURATION,
    });
    if (banError) {
      console.error("reactivateStaff: no se pudo volver a bloquear", banError);
    }
    return { status: "error" };
  }

  refresh();
  return { status: "success" };
}
