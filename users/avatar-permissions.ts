import type { AvatarPermissions } from "./types";

// En "Mi cuenta" cada usuario gestiona su propia foto
export const OWN_AVATAR_PERMISSIONS: AvatarPermissions = {
  canChange: true,
  canRemove: true,
};
