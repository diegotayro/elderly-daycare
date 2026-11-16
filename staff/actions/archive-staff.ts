"use server";

import { refresh } from "next/cache";
import { createAdminClient } from "@/shared/supabase/admin";
import { STAFF_BAN_DURATION } from "../staff-ban-duration";
import type { StaffActionResult } from "../types";
import { authorizeStaffAction } from "./authorize-staff-action";

export async function archiveStaff(
  staffId: string,
): Promise<StaffActionResult> {
  const supabase = await authorizeStaffAction(staffId, ["active"]);
  if (!supabase) return { status: "error" };

  const { data, error } = await supabase
    .from("users")
    .update({ status: "archived" })
    .eq("id", staffId)
    .eq("status", "active")
    .select("id");
  if (error) {
    console.error("archiveStaff: no se pudo archivar", error);
    return { status: "error" };
  }
  // RLS o un estado distinto actualizan 0 filas sin error
  if (data.length === 0) return { status: "error" };

  const { error: banError } =
    await createAdminClient().auth.admin.updateUserById(staffId, {
      ban_duration: STAFF_BAN_DURATION,
    });
  if (banError) {
    console.error("archiveStaff: no se pudo bloquear el login", banError);
    const { error: revertError } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", staffId);
    if (revertError) {
      console.error("archiveStaff: no se pudo revertir el status", revertError);
    }
    return { status: "error" };
  }

  refresh();
  return { status: "success" };
}
