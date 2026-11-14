import { getAvatarTone } from "@/elderly/get-avatar-tone";
import type { AvatarTone } from "@/elderly/avatar-tones";

export function buildAvatarTones(
  people: { id: string }[],
): Record<string, AvatarTone> {
  return Object.fromEntries(people.map(({ id }) => [id, getAvatarTone(id)]));
}
