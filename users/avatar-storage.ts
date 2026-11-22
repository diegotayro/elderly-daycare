import { isUuid } from "@/shared/text/is-uuid";

export const AVATARS_BUCKET = "avatars";

const AVATAR_FILE_EXTENSION = ".webp";

// Ruta de un archivo nuevo: un uuid distinto en cada subida evita que una url firmada vieja muestre la foto anterior
export function buildAvatarPath(userId: string): string {
  return `${userId}/${crypto.randomUUID()}${AVATAR_FILE_EXTENSION}`;
}

// La ruta tiene que ser exactamente `{userId}/{uuid}.webp`
export function isAvatarPathOf(userId: string, path: string): boolean {
  const [folder, file, ...rest] = path.split("/");
  if (folder !== userId || file === undefined || rest.length > 0) return false;
  return (
    file.endsWith(AVATAR_FILE_EXTENSION) &&
    isUuid(file.slice(0, -AVATAR_FILE_EXTENSION.length))
  );
}
