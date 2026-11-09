import Link from "next/link";
import { Suspense } from "react";
import { signIn } from "@/auth/actions/sign-in";
import { AuthField } from "./AuthField";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { LoginErrorMessage } from "./LoginErrorMessage";

type LoginFormProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export function LoginForm({ searchParams }: LoginFormProps) {
  return (
    <form action={signIn} className="w-full max-w-[392px]">
      <h2 className="mb-1.5 font-display text-[30px] font-semibold text-ink">
        Iniciar sesión
      </h2>
      <p className="mb-7 text-[15px] text-muted-strong">
        Ingresa para ver el día de hoy.
      </p>

      <Suspense fallback={null}>
        <LoginErrorMessage searchParams={searchParams} />
      </Suspense>

      <div className="mb-[18px]">
        <AuthField
          id="email"
          label="EMAIL"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
        />
      </div>
      <div className="mb-2.5">
        <AuthField
          id="password"
          label="CONTRASEÑA"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      <div className="mb-5 text-right">
        <Link href="/" className="text-[13.5px] font-bold text-coral-link">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <AuthSubmitButton>Iniciar sesión</AuthSubmitButton>

      <p className="mt-6 text-center text-[14.5px] text-muted-strong">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className="font-extrabold text-coral-link"
        >
          Activa tu cuenta
        </Link>
      </p>
    </form>
  );
}
