import type { Elderly } from "@/shared/database/types";
import type { ElderlyFormValues } from "./types";

// Valores de la fila tal como los muestra el formulario de edición
export function toElderlyFormValues(elderly: Elderly): ElderlyFormValues {
  return {
    firstName: elderly.first_name,
    lastName: elderly.last_name,
    birthDate: elderly.birth_date,
    enrolledAt: elderly.enrolled_at,
    roomId: elderly.room_id,
    allergies: elderly.allergy_tags.join(", "),
    medicalNotes: elderly.medical_notes ?? "",
  };
}
