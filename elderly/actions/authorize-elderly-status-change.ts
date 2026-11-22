import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";

type SessionClient = ReturnType<typeof createClient>;

// Devuelve el cliente con sesión solo si quien llama es un admin activo
// y el id es un uuid válido; RLS limita las filas a su guardería.
export async function authorizeElderlyStatusChange(
  elderlyId: string,
): Promise<SessionClient | null> {
  if (typeof elderlyId !== "string" || !isUuid(elderlyId)) return null;

  const caller = await getCurrentUser();
  // getCurrentUser solo devuelve cuentas active (RLS)
  if (caller?.role !== "admin") return null;

  return createClient(await cookies());
}
