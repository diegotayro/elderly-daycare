import type { AvatarTone } from "@/elderly/avatar-tones";
import type { FamilyFeedElderly, FamilyPost } from "./types";

// El avatar de la publicación es el del primer adulto mayor etiquetado; null = anuncio general
export function findPostAuthor(
  { elderlyIds }: FamilyPost,
  elderly: FamilyFeedElderly[],
): { initial: string; tone: AvatarTone } | null {
  const owner = elderly.find(({ id }) => id === elderlyIds[0]);
  return owner ? { initial: owner.initial, tone: owner.tone } : null;
}
