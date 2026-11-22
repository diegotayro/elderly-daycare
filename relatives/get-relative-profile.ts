import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import { fetchAccountElderly } from "@/family/fetch-account-elderly";
import type { UserStatus } from "@/shared/database/types";
import { createClient } from "@/shared/supabase/server";
import { isUuid } from "@/shared/text/is-uuid";
import { signAvatarUrls } from "@/users/sign-avatar-urls";
import type { RelativeProfile } from "./types";

type RelativeRow = {
  id: string;
  full_name: string;
  status: UserStatus;
  avatar_url: string | null;
};

// Solo para el admin. null si no es admin, si el id no es válido o si no es un familiar
// de su guardería (la RLS ya oculta a los de otras guarderías).
// React cache evita consultar dos veces entre generateMetadata y la página.
export const getRelativeProfile = cache(
  async (id: string): Promise<RelativeProfile | null> => {
    if (!isUuid(id)) return null;

    const caller = await getCurrentUser();
    if (caller?.role !== "admin") return null;

    const supabase = createClient(await cookies());
    const [relativeResult, emailResult, elderly] = await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, status, avatar_url")
        .eq("role", "relative")
        .eq("id", id)
        .maybeSingle<RelativeRow>(),
      supabase.rpc("get_relative_email", { p_relative_id: id }),
      fetchAccountElderly(id),
    ]);
    if (relativeResult.error) throw relativeResult.error;
    if (emailResult.error) throw emailResult.error;

    const relative = relativeResult.data;
    const email: string | null = emailResult.data;
    if (!relative || email === null) return null;

    const photoUrls = await signAvatarUrls([relative]);

    return {
      id: relative.id,
      fullName: relative.full_name,
      email,
      status: relative.status,
      photoUrl: photoUrls[relative.id] ?? null,
      elderly,
    };
  },
);
