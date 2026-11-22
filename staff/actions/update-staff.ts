"use server";

import { accountMessages } from "@/account/account-messages";
import { readProfileChanges } from "@/account/read-profile-changes";
import type {
  ActionResult,
  ProfileChanges,
  ProfileErrors,
} from "@/account/types";
import { applyProfileChanges } from "@/users/apply-profile-changes";
import { fetchStaffEmails } from "../fetch-staff-emails";
import { authorizeStaffAction } from "./authorize-staff-action";

const error: ActionResult<ProfileErrors> = {
  status: "error",
  message: accountMessages.profileSaveError,
};

type StaffRow = {
  first_name: string;
  last_name: string;
  status: "active" | "pending";
};

// Solo el admin; no se edita a un staff archived. De un staff pending solo se cambian los nombres:
// su email no se edita (se cancela la invitación y se invita de nuevo).
export async function updateStaff(
  staffId: string,
  changes: ProfileChanges,
): Promise<ActionResult<ProfileErrors>> {
  const supabase = await authorizeStaffAction(staffId, ["active", "pending"]);
  if (!supabase) return error;

  const { data: staff, error: readError } = await supabase
    .from("users")
    .select("first_name, last_name, status")
    .eq("id", staffId)
    .maybeSingle<StaffRow>();
  if (readError || !staff) {
    console.error("updateStaff: no se pudo leer al staff", readError);
    return error;
  }

  const isActive = staff.status === "active";
  const email = isActive
    ? (await fetchStaffEmails(supabase)).get(staffId)
    : undefined;
  if (isActive && email === undefined) return error;

  return applyProfileChanges(
    supabase,
    staffId,
    { firstName: staff.first_name, lastName: staff.last_name, email },
    readProfileChanges(changes, ["firstName", "lastName", "email"]),
  );
}
