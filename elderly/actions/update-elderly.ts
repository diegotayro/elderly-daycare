"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import type { Elderly } from "@/shared/database/types";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { diffElderlyChanges } from "../diff-elderly-changes";
import { fetchRoomIds } from "../fetch-room-ids";
import { parseAllergyTags } from "../parse-allergy-tags";
import { readElderlyFormValues } from "../read-elderly-form-values";
import { toElderlyFormValues } from "../to-elderly-form-values";
import type {
  ElderlyFormField,
  ElderlyFormValues,
  UpdateElderlyResult,
} from "../types";
import { validateElderlyForm } from "../validate-elderly-form";

type ElderlyColumns = Partial<
  Pick<
    Elderly,
    | "first_name"
    | "last_name"
    | "birth_date"
    | "enrolled_at"
    | "room_id"
    | "allergy_tags"
    | "medical_notes"
  >
>;

const columnsByField: Record<
  ElderlyFormField,
  (values: ElderlyFormValues) => ElderlyColumns
> = {
  firstName: (values) => ({ first_name: values.firstName.trim() }),
  lastName: (values) => ({ last_name: values.lastName.trim() }),
  birthDate: (values) => ({ birth_date: values.birthDate }),
  enrolledAt: (values) => ({ enrolled_at: values.enrolledAt }),
  roomId: (values) => ({ room_id: values.roomId }),
  allergies: (values) => ({ allergy_tags: parseAllergyTags(values.allergies) }),
  medicalNotes: (values) => ({
    medical_notes: values.medicalNotes.trim() || null,
  }),
};

// Solo el admin edita y solo adultos mayores active; RLS limita a su guardería.
// Actualiza únicamente los campos que difieren de la fila actual.
export async function updateElderly(
  elderlyId: string,
  formData: FormData,
): Promise<UpdateElderlyResult> {
  if (typeof elderlyId !== "string" || !isUuid(elderlyId)) {
    return { status: "error" };
  }

  const caller = await getCurrentUser();
  // getCurrentUser solo devuelve cuentas active (RLS)
  if (caller?.role !== "admin") return { status: "error" };

  const supabase = createClient(await cookies());
  const { data: current, error: readError } = await supabase
    .from("elderly")
    .select("*")
    .eq("id", elderlyId)
    .maybeSingle();
  if (readError) {
    console.error("updateElderly: no se pudo leer la fila", readError);
    return { status: "error" };
  }
  if (!current || current.status !== "active") return { status: "error" };

  const roomIds = await fetchRoomIds(supabase);
  if (!roomIds) return { status: "error" };

  const input = readElderlyFormValues(formData);
  const errors = validateElderlyForm(input, { today: getLimaToday(), roomIds });
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const changedFields = diffElderlyChanges(toElderlyFormValues(current), input);
  if (changedFields.length === 0) return { status: "success" };

  const columns = Object.assign(
    {},
    ...changedFields.map((field) => columnsByField[field](input)),
  );
  const { data, error: updateError } = await supabase
    .from("elderly")
    .update(columns)
    .eq("id", elderlyId)
    .eq("status", "active")
    .select("id");
  // RLS actualiza 0 filas sin error
  if (updateError || data.length === 0) {
    console.error("updateElderly: no se pudo guardar", updateError);
    return { status: "error" };
  }

  refresh();
  return { status: "success" };
}
