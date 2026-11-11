const MIN_PASSWORD_LENGTH = 8;

// Mínimo 8 caracteres, con al menos una letra y un número
export function isValidPassword(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}
