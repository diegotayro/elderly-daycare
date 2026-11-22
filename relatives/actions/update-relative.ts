"use server";

import { cookies } from "next/headers";
import { accountMessages } from "@/account/account-messages";
import { readProfileChanges } from "@/account/read-profile-changes";
import type {
  ActionResult,
  ProfileChanges,
  ProfileErrors,
} from "@/account/types";
import { getCurrentUser } from "@/auth/get-current-user";
import type { UserRole, UserStatus } from "@/shared/database/types";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { applyProfileChanges } from "@/users/apply-profile-changes";

const error: ActionResult<ProfileErrors> = {
  status: "error",
  message: accountMessages.profileSaveError,
};

type RelativeRow = {
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
};

// Solo el admin; el familiar tiene que ser de su guardería (la RLS ya lo limita) y no estar archived
export async function updateRelative(
  relativeId: string,
  changes: ProfileChanges,
): Promise<ActionResult<ProfileErrors>> {
  if (typeof relativeId !== "string" || !isUuid(relativeId)) return error;

  const caller = await getCurrentUser();
  if (caller?.role !== "admin") return error;

  const supabase = createClient(await cookies());
  const [relativeResult, emailResult] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, role, status")
      .eq("id", relativeId)
      .maybeSingle<RelativeRow>(),
    supabase.rpc("get_relative_email", { p_relative_id: relativeId }),
  ]);
  if (relativeResult.error || emailResult.error) {
    console.error(
      "updateRelative: no se pudo leer al familiar",
      relativeResult.error ?? emailResult.error,
    );
    return error;
  }

  const relative = relativeResult.data;
  const email: string | null = emailResult.data;
  if (!relative || relative.role !== "relative") return error;
  if (relative.status === "archived" || email === null) return error;

  return applyProfileChanges(
    supabase,
    relativeId,
    { firstName: relative.first_name, lastName: relative.last_name, email },
    readProfileChanges(changes, ["firstName", "lastName", "email"]),
  );
}
