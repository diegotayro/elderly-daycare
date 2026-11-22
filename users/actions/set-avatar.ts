"use server";

import { refresh } from "next/cache";
import { AVATARS_BUCKET, isAvatarPathOf } from "../avatar-storage";
import type { AvatarActionResult } from "../types";
import { authorizeAvatarAction } from "./authorize-avatar-action";

// El archivo ya lo subió el navegador a `{userId}/{uuid}.webp`; aquí se guarda la ruta
// y se borra la foto anterior
export async function setAvatar(
  userId: string,
  path: string,
): Promise<AvatarActionResult> {
  if (typeof path !== "string") return { status: "error" };

  const supabase = await authorizeAvatarAction(userId, { allowArchived: false });
  if (!supabase || !isAvatarPathOf(userId, path)) return { status: "error" };
  const storage = supabase.storage.from(AVATARS_BUCKET);

  const { data: current, error: readError } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle<{ avatar_url: string | null }>();
  if (readError || !current) {
    console.error("setAvatar: no se pudo leer el avatar actual", readError);
    await storage.remove([path]);
    return { status: "error" };
  }

  const { data, error } = await supabase
    .from("users")
    .update({ avatar_url: path })
    .eq("id", userId)
    .select("id");
  // RLS actualiza 0 filas sin error
  if (error || data.length === 0) {
    console.error("setAvatar: no se pudo guardar el avatar", error);
    await storage.remove([path]);
    return { status: "error" };
  }

  const previousPath = current.avatar_url;
  if (previousPath && previousPath !== path) {
    const { error: removeError } = await storage.remove([previousPath]);
    // El avatar nuevo ya quedó guardado: un archivo viejo sin borrar no es un error
    if (removeError) {
      console.error("setAvatar: no se pudo borrar la foto anterior", removeError);
    }
  }

  refresh();
  return { status: "ok" };
}
