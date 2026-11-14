"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createAdminClient } from "@/shared/supabase/admin";
import { createClient } from "@/shared/supabase/server";
import { getAcceptInviteUrl } from "../get-accept-invite-url";
import { newStaffMessages as messages } from "../new-staff-messages";
import { readNewStaffInput } from "../read-new-staff-input";
import type { InviteStaffResult } from "../types";
import { validateNewStaff } from "../validate-new-staff";

export async function inviteStaff(
  formData: FormData,
): Promise<InviteStaffResult> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { status: "error" };

  const input = readNewStaffInput(formData);
  const errors = validateNewStaff(input);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const email = input.email.trim().toLowerCase();
  const supabase = createClient(await cookies());

  const [teamEmailResult, daycareResult] = await Promise.all([
    supabase.rpc("is_team_email", { p_email: email }),
    supabase.rpc("current_user_daycare_id"),
  ]);
  if (teamEmailResult.error || daycareResult.error || !daycareResult.data) {
    console.error(
      "inviteStaff: no se pudo validar el email",
      teamEmailResult.error ?? daycareResult.error,
    );
    return { status: "error" };
  }
  if (teamEmailResult.data) {
    return { status: "invalid", errors: { email: messages.teamEmail } };
  }

  // role y daycare_id los fija el servidor, nunca el formulario
  const { error } = await createAdminClient().auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: getAcceptInviteUrl(),
      data: {
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        role: "staff",
        daycare_id: daycareResult.data,
      },
    },
  );
  if (error) {
    if (error.code === "email_exists") {
      return {
        status: "invalid",
        errors: { email: messages.emailHasAccount },
      };
    }
    console.error("inviteStaff: no se pudo invitar", error);
    // Si la cuenta se creó pero falló el correo, aparece en PENDIENTES
    refresh();
    return { status: "error" };
  }

  refresh();
  return { status: "success", email };
}
