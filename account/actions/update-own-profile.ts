"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { accountMessages } from "../account-messages";
import { diffProfileChanges } from "../diff-profile-changes";
import { readProfileChanges } from "../read-profile-changes";
import type { ActionResult, ProfileChanges, ProfileErrors } from "../types";
import { validateProfileNames } from "../validate-profile";

const error: ActionResult<ProfileErrors> = {
  status: "error",
  message: accountMessages.profileSaveError,
};

// Solo el admin cambia su nombre. El email no se cambia aquí.
export async function updateOwnProfile(
  changes: ProfileChanges,
): Promise<ActionResult<ProfileErrors>> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return error;

  const requested = readProfileChanges(changes, ["firstName", "lastName"]);

  const supabase = createClient(await cookies());
  const { data: current, error: readError } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string; last_name: string }>();
  if (readError || !current) {
    console.error("updateOwnProfile: no se pudo leer el perfil", readError);
    return error;
  }

  // Se vuelve a comparar con la fila actual: no se confía en el cliente
  const effective = diffProfileChanges(
    { firstName: current.first_name, lastName: current.last_name },
    requested,
  );
  if (Object.keys(effective).length === 0) return { status: "ok" };

  const errors = validateProfileNames(effective);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const { data, error: updateError } = await supabase
    .from("users")
    .update({
      ...(effective.firstName !== undefined && {
        first_name: effective.firstName,
      }),
      ...(effective.lastName !== undefined && { last_name: effective.lastName }),
    })
    .eq("id", user.id)
    .select("id");
  // RLS actualiza 0 filas sin error
  if (updateError || data.length === 0) {
    console.error("updateOwnProfile: no se pudo guardar", updateError);
    return error;
  }

  refresh();
  return { status: "ok" };
}
