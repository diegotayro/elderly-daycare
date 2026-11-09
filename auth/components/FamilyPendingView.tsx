import { AuthBrandMark } from "./AuthBrandMark";
import { SignOutForm } from "./SignOutForm";

// Pantalla temporal: se elimina en la spec de pantallas para familiares.
export function FamilyPendingView() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-[392px] flex-col items-center rounded-[20px] bg-white p-8 text-center">
        <AuthBrandMark className="mb-6" />
        <h1 className="mb-2 font-display text-[26px] font-semibold text-ink">
          Acceso para familias
        </h1>
        <p className="mb-7 text-[15px] text-muted-strong">
          Estamos preparando este espacio. Vuelve pronto para ver el día de tu
          familiar.
        </p>
        <SignOutForm className="w-full cursor-pointer rounded-[14px] border-[1.5px] border-logout-line bg-logout-bg p-3.5 text-[15px] font-extrabold text-coral-strong">
          Cerrar sesión
        </SignOutForm>
      </div>
    </div>
  );
}
