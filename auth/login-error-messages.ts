import type { LoginErrorCode } from "@/auth/types";

export const loginErrorMessages: Record<LoginErrorCode, string> = {
  invalid_credentials: "El email o la contraseña no son correctos.",
  inactive_account: "Tu cuenta no está activa. Comunícate con la guardería.",
  invalid_invitation_link:
    "El enlace de invitación no es válido o ya venció. Pide a la guardería que te lo reenvíe.",
  unexpected: "No pudimos iniciar sesión. Inténtalo de nuevo.",
};
