"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { getLimaToday } from "@/shared/date/get-lima-today";
import { createClient } from "@/shared/supabase/server";
import { parseAllergyTags } from "../parse-allergy-tags";
import { readNewElderlyInput } from "../read-new-elderly-input";
import type { CreateElderlyResult } from "../types";
import { validateNewElderly } from "../validate-new-elderly";

export async function createElderly(
  formData: FormData,
): Promise<CreateElderlyResult> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { status: "error" };

  const input = readNewElderlyInput(formData);
  const supabase = createClient(await cookies());

  // RLS limita las habitaciones a las de su guardería
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id");
  if (roomsError) {
    console.error(
      "createElderly: no se pudieron leer las habitaciones",
      roomsError,
    );
    return { status: "error" };
  }

  const errors = validateNewElderly(input, {
    today: getLimaToday(),
    roomIds: rooms.map((room) => room.id),
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
