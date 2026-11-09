import type { AvatarTone } from "./avatar-tones";

const elderlyTones: AvatarTone[] = ["blue", "pink", "green", "yellow", "purple"];

// Mismo id, mismo color: suma los códigos de los caracteres y toma el resto
export function getAvatarTone(id: string): AvatarTone {
  let charCodeSum = 0;
  for (const character of id) {
    charCodeSum += character.charCodeAt(0);
  }
  return elderlyTones[charCodeSum % elderlyTones.length];
}
