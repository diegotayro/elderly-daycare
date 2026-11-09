import type { AvatarTone } from "@/elderly/avatar-tones";
import type { User } from "@/shared/database/types";

export type InvitationPreview = {
  code: string; // "7K4P9"
  email: string; // "diego.fernandez@example.com"
  elderlyFullName: string; // "Luis Fernández"
  elderlyInitial: string; // "L"
  elderlyTone: AvatarTone; // "blue"
  roomName: string; // "Roble"
};

export type CurrentUser = Pick<
  User,
  "id" | "role" | "full_name" | "notify_on_post" | "daily_summary_enabled"
> & {
  email: string;
  daycareName: string;
};

export type LoginErrorCode =
  "invalid_credentials" | "inactive_account" | "unexpected";
