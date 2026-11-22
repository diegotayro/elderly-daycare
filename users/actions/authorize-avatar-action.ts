import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import type { UserRole, UserStatus } from "@/shared/database/types";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";

type SessionClient = ReturnType<typeof createClient>;

const MANAGEABLE_ROLES: UserRole[] = ["staff", "relative"];

// Devuelve el cliente con sesión solo si quien llama puede gestionar la foto de userId:
// él mismo, o un admin con un staff o relative de su guardería (visible por RLS).
// El admin no toca a otro admin; sobre un archived solo puede quitar la foto.
export async function authorizeAvatarAction(
  userId: string,
  options: { allowArchived: boolean },
): Promise<SessionClient | null> {
  if (typeof userId !== "string" || !isUuid(userId)) return null;

  const caller = await getCurrentUser();
  if (!caller) return null;

  const supabase = createClient(await cookies());
  if (caller.id === userId) return supabase;
  if (caller.role !== "admin") return null;

  const { data, error } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", userId)
    .maybeSingle<{ role: UserRole; status: UserStatus }>();
  if (error) {
    console.error("authorizeAvatarAction: no se pudo leer al usuario", error);
    return null;
  }
  if (!data || !MANAGEABLE_ROLES.includes(data.role)) return null;
  if (data.status === "archived" && !options.allowArchived) return null;

  return supabase;
}
