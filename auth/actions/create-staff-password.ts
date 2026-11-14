"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPasswordMessages as messages } from "@/auth/create-password-messages";
import { TEAM_HOME } from "@/auth/home-routes";
import { readCreatePasswordInput } from "@/auth/read-create-password-input";
import type { CreatePasswordResult } from "@/auth/types";
import { validateCreatePassword } from "@/auth/validate-create-password";
import { createClient } from "@/shared/supabase/server";

function failed(message: string): CreatePasswordResult {
  return { status: "error", message };
}

// null = la contraseña quedó guardada; si no, el resultado a devolver
async function savePassword(
  supabase: SupabaseClient,
  password: string,
): Promise<CreatePasswordResult | null> {
  const { error } = await supabase.auth.updateUser({ password });
  if (!error) return null;

  if (error.code === "weak_password") {
    return {
      status: "invalid",
      errors: { password: messages.passwordRule },
    };
  }
  console.error("createStaffPassword: no se pudo guardar la contraseña", error);
  return failed(messages.unexpected);
}

// No recibe ningún id: todo se hace con la sesión de quien llama
export async function createStaffPassword(
  formData: FormData,
): Promise<CreatePasswordResult> {
  const errors = validateCreatePassword(readCreatePasswordInput(formData));
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const supabase = createClient(await cookies());
  const pendingResult = await supabase.rpc("is_pending_staff");
  if (pendingResult.error) {
    console.error(
      "createStaffPassword: is_pending_staff falló",
      pendingResult.error,
    );
    return failed(messages.unexpected);
  }
  if (pendingResult.data !== true) return failed(messages.notPendingStaff);

  const { password } = readCreatePasswordInput(formData);
  const saveFailure = await savePassword(supabase, password);
  if (saveFailure) return saveFailure;

  const { error } = await supabase.rpc("activate_staff_account");
  if (error) {
    console.error("createStaffPassword: no se pudo activar la cuenta", error);
    return failed(
      error.message.includes("not_a_pending_staff")
        ? messages.notPendingStaff
        : messages.unexpected,
    );
  }

  revalidatePath("/", "layout");
  redirect(TEAM_HOME);
}
