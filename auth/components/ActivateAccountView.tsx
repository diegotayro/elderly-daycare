import type { ReactNode } from "react";
import { AuthFormView } from "./AuthFormView";

type ActivateAccountViewProps = {
  children: ReactNode;
};

export function ActivateAccountView({ children }: ActivateAccountViewProps) {
  return (
    <AuthFormView
      title="Te damos la bienvenida a Casa Nogal"
      description="Te invitaron a seguir el día de tu familiar. Crea tu contraseña para activar la cuenta."
    >
      {children}
    </AuthFormView>
  );
}
