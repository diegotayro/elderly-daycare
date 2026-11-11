import Link from "next/link";
import type { InvitationPreview } from "../types";
import { AuthField } from "./AuthField";
import { AuthSubmitLink } from "./AuthSubmitLink";
import { InvitationCard } from "./InvitationCard";
import { PhotoConsentCheckbox } from "./PhotoConsentCheckbox";

type ActivateAccountFormProps = {
  invitation: InvitationPreview | null;
  disabled?: boolean; // fallback de Suspense: mismo formulario mientras llega la invitación
};

export function ActivateAccountForm({
  invitation,
  disabled,
}: ActivateAccountFormProps) {
  const hasAccount = invitation?.hasAccount ?? false;

  return (
    <>
      {invitation && <InvitationCard invitation={invitation} />}

      <fieldset disabled={disabled} className="m-0 min-w-0 border-0 p-0">
        <div className="mb-[18px]">
          <AuthField
            id="code"
            label="CÓDIGO DE INVITACIÓN"
            defaultValue={invitation?.code}
            autoComplete="one-time-code"
            inputClassName="font-display text-[18px] font-bold tracking-[3px]"
          />
        </div>
        <div className="mb-[18px]">
          <AuthField
            id="email"
            label="EMAIL"
            type="email"
            defaultValue={invitation?.email}
            autoComplete="email"
          />
        </div>
        <div className="mb-[18px]">
          <AuthField
            id="password"
            label={hasAccount ? "INGRESE SU CONTRASEÑA" : "CREAR CONTRASEÑA"}
            type="password"
            autoComplete={hasAccount ? "current-password" : "new-password"}
          />
        </div>

        <PhotoConsentCheckbox />
      </fieldset>

      <AuthSubmitLink href="/">Activar mi cuenta</AuthSubmitLink>

      <p className="mt-[22px] text-center text-[14.5px] text-muted-strong">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-extrabold text-coral-link">
          Iniciar sesión
        </Link>
      </p>
    </>
  );
}
