import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { CurrentUser } from "@/auth/types";
import { createClient } from "@/shared/supabase/server";

type CurrentUserRow = Omit<CurrentUser, "email" | "daycareName"> & {
  daycares: { name: string };
};

// null = sin sesión o sin fila visible en users (cuenta no activa, por RLS)
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = createClient(await cookies());

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims) return null;

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, role, full_name, notify_on_post, daily_summary_enabled, daycares!inner(name)",
    )
    .eq("id", claims.sub)
    .maybeSingle<CurrentUserRow>();
  if (error) throw error;
  if (!data) return null;

  const { daycares, ...user } = data;
  return { ...user, email: claims.email ?? "", daycareName: daycares.name };
});
