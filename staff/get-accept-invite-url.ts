import "server-only";

// Adonde Supabase redirige después de validar el link del correo
export function getAcceptInviteUrl(): string {
  return `${process.env.APP_URL}/accept-invite`;
}
