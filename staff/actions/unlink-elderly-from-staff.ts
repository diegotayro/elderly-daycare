"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import type { StaffActionResult } from "../types";

export async function unlinkElderlyFromStaff(
  linkId: string,
): Promise<StaffActionResult> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { status: "error" };
  if (!isUuid(linkId)) return { status: "error" };

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("staff_elderly")
    .delete()
    .eq("id", linkId)
    .select("id");
  if (error) {
    console.error("unlinkElderlyFromStaff: no se pudo borrar", error);
    return { status: "error" };
  }
  // RLS o un id inexistente borran 0 filas sin error
  if (data.length === 0) return { status: "error" };

  refresh();
  return { status: "success" };
}
