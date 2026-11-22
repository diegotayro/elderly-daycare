"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import { fetchRoomIds } from "../fetch-room-ids";
import { parseAllergyTags } from "../parse-allergy-tags";
import { readElderlyFormValues } from "../read-elderly-form-values";
import type { CreateElderlyResult } from "../types";
import { validateElderlyForm } from "../validate-elderly-form";

export async function createElderly(
  formData: FormData,
): Promise<CreateElderlyResult> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { status: "error" };

  const input = readElderlyFormValues(formData);
  const supabase = createClient(await cookies());

  const roomIds = await fetchRoomIds(supabase);
  if (!roomIds) return { status: "error" };

  const errors = validateElderlyForm(input, {
    today: getLimaToday(),
    roomIds,
  });
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const { error: insertError } = await supabase.from("elderly").insert({
    room_id: input.roomId,
    first_name: firstName,
    last_name: lastName,
    birth_date: input.birthDate,
    enrolled_at: input.enrolledAt,
    allergy_tags: parseAllergyTags(input.allergies),
    medical_notes: input.medicalNotes.trim() || null,
  });
  if (insertError) {
    console.error("createElderly: no se pudo insertar", insertError);
    return { status: "error" };
  }

  refresh();
  return { status: "success", fullName: `${firstName} ${lastName}` };
}
