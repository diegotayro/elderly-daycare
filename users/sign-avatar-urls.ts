import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/shared/supabase/server";

const AVATARS_BUCKET = "avatars";
const SIGNED_URL_SECONDS = 3600;

export type AvatarOwner = { id: string; avatar_url: string | null };

// Una sola llamada por pantalla. Devuelve la url firmada por id de usuario;
// si la firma falla, el usuario queda fuera y la UI muestra sus iniciales
export async function signAvatarUrls(
  owners: AvatarOwner[],
): Promise<Record<string, string>> {
  const pathByOwnerId = new Map(
    owners.flatMap(({ id, avatar_url }) =>
      avatar_url ? [[id, avatar_url] as const] : [],
    ),
  );
  if (pathByOwnerId.size === 0) return {};

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrls([...new Set(pathByOwnerId.values())], SIGNED_URL_SECONDS);
  if (error) {
    console.error("signAvatarUrls: no se pudieron firmar los avatares", error);
    return {};
  }

  const urlByPath = new Map(
    data.flatMap(({ path, signedUrl }) =>
      path && signedUrl ? [[path, signedUrl] as const] : [],
    ),
  );

  const urlByOwnerId: Record<string, string> = {};
  for (const [ownerId, path] of pathByOwnerId) {
    const url = urlByPath.get(path);
    if (url) urlByOwnerId[ownerId] = url;
  }
  return urlByOwnerId;
}
