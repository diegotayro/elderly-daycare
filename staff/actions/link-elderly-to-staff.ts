"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import type { StaffActionResult } from "../types";

// RLS exige admin de la misma guardería y staff active
export async function linkElderlyToStaff(
  staffId: string,
  elderlyIds: string[],
): Promise<StaffActionResult> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { status: "error" };
  if (!isUuid(staffId) || elderlyIds.length === 0) return { status: "error" };
  if (!elderlyIds.every(isUuid)) return { status: "error" };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("staff_elderly").insert(
    elderlyIds.map((elderlyId) => ({
      staff_id: staffId,
      elderly_id: elderlyId,
    })),
  );
  if (error) {
    console.error("linkElderlyToStaff: no se pudo insertar", error);
    return { status: "error" };
  }

  refresh();
  return { status: "success" };
}
