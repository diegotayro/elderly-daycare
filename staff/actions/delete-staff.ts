"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/shared/supabase/admin";
import type { DeleteStaffResult } from "../types";
import { authorizeStaffAction } from "./authorize-staff-action";

export async function deleteStaff(staffId: string): Promise<DeleteStaffResult> {
  const supabase = await authorizeStaffAction(staffId, ["active", "archived"]);
  if (!supabase) return { status: "error" };

  const historyBefore = await supabase.rpc("staff_has_history", {
    p_staff_id: staffId,
  });
  if (historyBefore.error) {
    console.error(
      "deleteStaff: no se pudo leer el historial",
      historyBefore.error,
    );
    return { status: "error" };
  }
  if (historyBefore.data === true) return { status: "has-history" };

  // La cascada borra users y staff_elderly
  const { error } = await createAdminClient().auth.admin.deleteUser(staffId);
  if (error) {
    // Historial creado entre la lectura y el borrado: la FK restrict lo impide
    const historyAfter = await supabase.rpc("staff_has_history", {
      p_staff_id: staffId,
    });
    if (historyAfter.data === true) return { status: "has-history" };
    console.error("deleteStaff: no se pudo borrar", error);
    return { status: "error" };
  }

  redirect("/staff?notice=staff-deleted");
}
