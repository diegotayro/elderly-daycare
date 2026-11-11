import type { AvatarTone } from "@/elderly/avatar-tones";
import type { User } from "@/shared/database/types";

export type InvitationPreview = {
  code: string; // "7K4P9"
  email: string; // "diego.fernandez@example.com"
  elderlyFullName: string; // "Luis Fernández"
  elderlyInitial: string; // "L"
  elderlyTone: AvatarTone; // "blue"
  roomName: string; // "Roble"
  hasAccount: boolean; // decide CREAR vs INGRESE SU CONTRASEÑA
};

export type PasswordMode = "create" | "existing";

// Valores del formulario de activación tal como llegan del FormData
export type ActivateAccountInput = {
  code: string;
  email: string;
  password: string;
  photoConsent: boolean;
};

export type ActivateAccountField = "code" | "email" | "password";
export type ActivateAccountErrors = Partial<
  Record<ActivateAccountField, string>
>;

// Si todo sale bien la acción redirige, así que no hay resultado de éxito
export type ActivateAccountResult =
  | {
      status: "invalid";
      errors: ActivateAccountErrors;
      passwordMode: PasswordMode;
    }
  | { status: "error"; message: string; passwordMode: PasswordMode };

export type CurrentUser = Pick<
  User,
  "id" | "role" | "full_name" | "notify_on_post" | "daily_summary_enabled"
> & {
  email: string;
  daycareName: string;
};

export type LoginErrorCode =
  "invalid_credentials" | "inactive_account" | "unexpected";
