"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createAdminClient } from "@/shared/supabase/admin";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { fetchStaffEmails } from "../fetch-staff-emails";
import { getAcceptInviteUrl } from "../get-accept-invite-url";
import { buildStaffInvitationOptions } from "../staff-invitation-options";
import type { StaffActionResult } from "../types";

// El staff abrió el link anterior (email confirmado) pero no creó la contraseña
async function sendRecoveryLink(email: string): Promise<StaffActionResult> {
  const { error } = await createAdminClient().auth.resetPasswordForEmail(
    email,
    { redirectTo: getAcceptInviteUrl() },
  );
  if (error) {
    console.error(
      "resendStaffInvitation: no se pudo enviar la recuperación",
      error,
    );
    return { status: "error" };
  }
  return { status: "success" };
}

export async function resendStaffInvitation(
  staffId: string,
): Promise<StaffActionResult> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { status: "error" };
  if (!isUuid(staffId)) return { status: "error" };

  // RLS limita la lectura a la guardería del admin
  const supabase = createClient(await cookies());
  const [staffResult, emails] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, daycare_id, status")
      .eq("role", "staff")
      .eq("id", staffId)
      .maybeSingle(),
    fetchStaffEmails(supabase),
  ]);
  if (staffResult.error) {
    console.error(
      "resendStaffInvitation: no se pudo leer al staff",
      staffResult.error,
    );
    return { status: "error" };
  }
  const staff = staffResult.data;
  const email = emails.get(staffId);
  if (!staff || !email || staff.status !== "pending")
    return { status: "error" };

  const { error } = await createAdminClient().auth.admin.inviteUserByEmail(
    email,
    buildStaffInvitationOptions({
      firstName: staff.first_name,
      lastName: staff.last_name,
      daycareId: staff.daycare_id,
    }),
  );
  if (!error) return { status: "success" };

  if (error.code === "email_exists") return sendRecoveryLink(email);
  console.error("resendStaffInvitation: no se pudo reenviar", error);
  return { status: "error" };
}
