export type AvatarTone =
  | "blue"
  | "pink"
  | "green"
  | "yellow"
  | "purple"
  | "lilac"
  | "sky";

export const avatarTones: Record<AvatarTone, { bg: string; fg: string }> = {
  blue: { bg: "#A9D9E8", fg: "#1F7A93" },
  pink: { bg: "#F4B8CC", fg: "#C44A7A" },
  green: { bg: "#B9DEC4", fg: "#3E8B62" },
  yellow: { bg: "#F4DC8E", fg: "#9A7B1E" },
  purple: { bg: "#C9B6E8", fg: "#7B5FC0" },
  lilac: { bg: "#C9B6E8", fg: "#FFFFFF" }, // familiares
  sky: { bg: "#A9C7E8", fg: "#FFFFFF" }, // familiares
};
