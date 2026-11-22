"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import type { PhotoConsentResult } from "../types";

// Solo el admin cambia el consentimiento; RLS limita a su guardería
// Estado deseado e idempotente: repetir la llamada no cambia el resultado
export async function updatePhotoConsent(
  elderlyId: string,
  value: boolean,
): Promise<PhotoConsentResult> {
  const isValidInput =
    typeof elderlyId === "string" &&
    isUuid(elderlyId) &&
    typeof value === "boolean";
  if (!isValidInput) return { status: "error" };

  const caller = await getCurrentUser();
  // getCurrentUser solo devuelve cuentas active (RLS)
  if (caller?.role !== "admin") return { status: "error" };

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("elderly")
    .update({ photo_consent: value })
    .eq("id", elderlyId)
    .eq("status", "active")
    .select("id");
  // RLS actualiza 0 filas sin error
  if (error || data.length === 0) {
    console.error("updatePhotoConsent: no se pudo guardar", error);
    return { status: "error" };
  }

  refresh();
  return { status: "ok" };
}
