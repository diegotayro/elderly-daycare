const MIN_PASSWORD_LENGTH = 8;

export const passwordMessages = {
  rule: "La contraseña debe tener al menos 8 caracteres, con letras y números.",
  confirmationRequired: "Vuelve a escribir la contraseña.",
  confirmationMismatch: "Las contraseñas no coinciden.",
} as const;

// Mínimo 8 caracteres, con al menos una letra y un número
export function isValidPassword(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (confirmation === "") return passwordMessages.confirmationRequired;
  if (confirmation !== password) return passwordMessages.confirmationMismatch;
}
