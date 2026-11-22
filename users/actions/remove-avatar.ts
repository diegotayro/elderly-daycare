"use server";

import { refresh } from "next/cache";
import { AVATARS_BUCKET } from "../avatar-storage";
import type { AvatarActionResult } from "../types";
import { authorizeAvatarAction } from "./authorize-avatar-action";

export async function removeAvatar(userId: string): Promise<AvatarActionResult> {
  const supabase = await authorizeAvatarAction(userId, { allowArchived: true });
  if (!supabase) return { status: "error" };

  const { data: current, error: readError } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle<{ avatar_url: string | null }>();
  if (readError || !current) {
    console.error("removeAvatar: no se pudo leer el avatar actual", readError);
    return { status: "error" };
  }

  const { data, error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", userId)
    .select("id");
  // RLS actualiza 0 filas sin error
  if (error || data.length === 0) {
    console.error("removeAvatar: no se pudo quitar el avatar", error);
    return { status: "error" };
  }

  if (current.avatar_url) {
    const { error: removeError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove([current.avatar_url]);
    // El avatar ya quedó en null: un archivo sin borrar no es un error
    if (removeError) {
      console.error("removeAvatar: no se pudo borrar el archivo", removeError);
    }
  }

  refresh();
  return { status: "ok" };
}
