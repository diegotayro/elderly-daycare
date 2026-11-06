import Link from "next/link";
import { AuthField } from "./AuthField";
import { AuthSubmitLink } from "./AuthSubmitLink";

export function LoginForm() {
  return (
    <div className="w-full max-w-[392px]">
      <h2 className="mb-1.5 font-display text-[30px] font-semibold text-ink">
        Iniciar sesión
      </h2>
      <p className="mb-7 text-[15px] text-muted-strong">
        Ingresa para ver el día de hoy.
      </p>

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

      <AuthSubmitLink href="/">Iniciar sesión</AuthSubmitLink>

      <p className="mt-6 text-center text-[14.5px] text-muted-strong">
        ¿Te invitó la guardería?{" "}
        <Link href="/activate-account" className="font-extrabold text-coral-link">
          Activa tu cuenta
        </Link>
      </p>
    </div>
  );
}
