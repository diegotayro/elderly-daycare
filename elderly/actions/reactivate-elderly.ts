"use server";

import { refresh } from "next/cache";
import type { ElderlyStatusResult } from "../types";
import { authorizeElderlyStatusChange } from "./authorize-elderly-status-change";

export async function reactivateElderly(
  elderlyId: string,
): Promise<ElderlyStatusResult> {
  const supabase = await authorizeElderlyStatusChange(elderlyId);
  if (!supabase) return { status: "error" };

  const { data, error } = await supabase
    .from("elderly")
    .update({ status: "active" })
    .eq("id", elderlyId)
    .eq("status", "archived")
    .select("id");
  if (error) {
    console.error("reactivateElderly: no se pudo reactivar", error);
    return { status: "error" };
  }
  // RLS o un estado distinto actualizan 0 filas sin error
  if (data.length === 0) return { status: "error" };

  refresh();
  return { status: "success" };
}
