"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { LoginErrorCode } from "@/auth/types";
import { RELATIVE_HOME, TEAM_HOME } from "@/auth/home-routes";
import { isValidPassword } from "@/auth/validate-password";
import { createClient } from "@/shared/supabase/server";

function redirectToLoginError(code: LoginErrorCode): never {
  redirect(`/login?error=${code}`);
}

function readCredential(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function toLoginErrorCode(authErrorCode: string | undefined): LoginErrorCode {
  if (authErrorCode === "invalid_credentials") return "invalid_credentials";
  if (authErrorCode === "user_banned") return "inactive_account";
  return "unexpected";
}

export async function signIn(formData: FormData) {
  const email = readCredential(formData, "email").trim();
  const password = readCredential(formData, "password");
  // No se revela la regla de contraseña a quien prueba cuentas ajenas
  if (!email || !isValidPassword(password)) {
    redirectToLoginError("invalid_credentials");
  }

  const supabase = createClient(await cookies());

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) redirectToLoginError(toLoginErrorCode(error.code));

  // Sin fila visible en users significa cuenta no activa (RLS)
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError) redirectToLoginError("unexpected");
  if (!profile) {
    await supabase.auth.signOut();
    redirectToLoginError("inactive_account");
  }

  revalidatePath("/", "layout");
  redirect(profile.role === "relative" ? RELATIVE_HOME : TEAM_HOME);
}
