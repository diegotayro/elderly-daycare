import type { ReactNode } from "react";
import { AuthBrandMark } from "./AuthBrandMark";

type ActivateAccountViewProps = {
  children: ReactNode;
};

export function ActivateAccountView({ children }: ActivateAccountViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 lg:p-10">
      <div className="w-full max-w-[440px]">
        <AuthBrandMark className="mb-[22px]" />
        <h1 className="mb-2 font-display text-[32px] leading-[1.15] font-semibold text-ink">
          Te damos la bienvenida a Casa Nogal
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
          Te invitaron a seguir el día de tu familiar. Crea tu contraseña para
          activar la cuenta.
        </p>
        {children}
      </div>
    </div>
  );
}
