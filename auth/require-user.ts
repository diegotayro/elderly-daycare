import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { CurrentUser } from "@/auth/types";
import { createClient } from "@/shared/supabase/server";
import { RELATIVE_HOME, TEAM_HOME } from "./home-routes";
import { getCurrentUser, getSessionClaims } from "./get-current-user";

async function isPendingStaff(): Promise<boolean> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("is_pending_staff");
  if (error) throw error;
  return data === true;
}

async function requireActiveUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user) return user;

  if ((await getSessionClaims()) === null) redirect("/login");
  // Staff invitado que aún no creó su contraseña: sigue en el flujo de activación
  if (await isPendingStaff()) redirect("/create-password");
  // Sesión sin fila en users: cuenta no activa, hay que cerrar la sesión
  redirect("/auth/end-session");
}

export async function requireTeamUser(): Promise<CurrentUser> {
  const user = await requireActiveUser();
  if (user.role === "relative") redirect(RELATIVE_HOME);
  return user;
}

export async function requireAdminUser(): Promise<CurrentUser> {
  const user = await requireTeamUser();
  if (user.role !== "admin") redirect(TEAM_HOME);
  return user;
}

export async function requireRelativeUser(): Promise<CurrentUser> {
  const user = await requireActiveUser();
  if (user.role !== "relative") redirect(TEAM_HOME);
  return user;
}
