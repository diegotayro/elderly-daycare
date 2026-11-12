import "server-only";
import { redirect } from "next/navigation";
import type { CurrentUser } from "@/auth/types";
import { RELATIVE_HOME, TEAM_HOME } from "./home-routes";
import { getCurrentUser, getSessionClaims } from "./get-current-user";

async function requireActiveUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user) return user;

  const hasSession = (await getSessionClaims()) !== null;
  // Sesión sin fila en users: cuenta no activa, hay que cerrar la sesión
  redirect(hasSession ? "/auth/end-session" : "/login");
}

export async function requireTeamUser(): Promise<CurrentUser> {
  const user = await requireActiveUser();
  if (user.role === "relative") redirect(RELATIVE_HOME);
  return user;
}

export async function requireRelativeUser(): Promise<CurrentUser> {
  const user = await requireActiveUser();
  if (user.role !== "relative") redirect(TEAM_HOME);
  return user;
}
