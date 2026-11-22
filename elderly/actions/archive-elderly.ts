"use server";

import { refresh } from "next/cache";
import type { ElderlyStatusResult } from "../types";
import { authorizeElderlyStatusChange } from "./authorize-elderly-status-change";

export async function archiveElderly(
  elderlyId: string,
): Promise<ElderlyStatusResult> {
  const supabase = await authorizeElderlyStatusChange(elderlyId);
  if (!supabase) return { status: "error" };

  const { data, error } = await supabase
    .from("elderly")
    .update({ status: "archived" })
    .eq("id", elderlyId)
    .eq("status", "active")
    .select("id");
  if (error) {
    console.error("archiveElderly: no se pudo archivar", error);
    return { status: "error" };
  }
  // RLS o un estado distinto actualizan 0 filas sin error
  if (data.length === 0) return { status: "error" };

  // Una sola sentencia: las invitaciones vencidas por fecha también se cancelan
  const { error: cancelError } = await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("elderly_id", elderlyId)
    .eq("status", "pending");
  if (cancelError) {
    console.error(
      "archiveElderly: no se pudieron cancelar las invitaciones",
      cancelError,
    );
    const { error: revertError } = await supabase
      .from("elderly")
      .update({ status: "active" })
      .eq("id", elderlyId);
    if (revertError) {
      console.error(
        "archiveElderly: no se pudo revertir el status",
        revertError,
      );
    }
    return { status: "error" };
  }

  refresh();
  return { status: "success" };
}
