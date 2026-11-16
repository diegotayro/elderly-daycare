"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/shared/supabase/admin";
import type { StaffActionResult } from "../types";
import { authorizeStaffAction } from "./authorize-staff-action";

export async function cancelStaffInvitation(
  staffId: string,
): Promise<StaffActionResult> {
  const supabase = await authorizeStaffAction(staffId, ["pending"]);
  if (!supabase) return { status: "error" };

  // La cascada borra la fila de users
  const { error } = await createAdminClient().auth.admin.deleteUser(staffId);
  if (error) {
    console.error("cancelStaffInvitation: no se pudo borrar", error);
    return { status: "error" };
  }

  redirect("/staff?notice=invitation-cancelled");
}
