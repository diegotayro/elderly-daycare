import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import type { UserStatus } from "@/shared/database/types";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";

type SessionClient = ReturnType<typeof createClient>;

// Devuelve el cliente con sesión solo si quien llama es admin y el staff
// (visible por RLS en su guardería) está en uno de los estados permitidos.
export async function authorizeStaffAction(
  staffId: string,
  allowedStatuses: UserStatus[],
): Promise<SessionClient | null> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return null;
  if (!isUuid(staffId)) return null;

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("users")
    .select("status")
    .eq("role", "staff")
    .eq("id", staffId)
    .maybeSingle();
  if (error) {
    console.error("authorizeStaffAction: no se pudo leer al staff", error);
    return null;
  }
  const status: UserStatus | undefined = data?.status;
  if (!status || !allowedStatuses.includes(status)) return null;

  return supabase;
}
