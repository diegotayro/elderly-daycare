export type NotificationPreferenceResult =
  { status: "ok" } | { status: "error" };

export type ProfileField = "firstName" | "lastName" | "email";

// Solo los campos que cambiaron, ya normalizados (ver diff-profile-changes.ts)
export type ProfileChanges = Partial<Record<ProfileField, string>>;

export type ProfileErrors = Partial<Record<ProfileField, string>>;

export type ActionResult<E = Record<string, string>> =
  | { status: "ok" }
  | { status: "invalid"; errors: E }
  | { status: "error"; message: string };
