import Link from "next/link";
import type { InvitationPreview } from "../types";
import { AuthField } from "./AuthField";
import { AuthSubmitLink } from "./AuthSubmitLink";
import { InvitationCard } from "./InvitationCard";
import { PhotoConsentCheckbox } from "./PhotoConsentCheckbox";

type ActivateAccountFormProps = {
  invitation: InvitationPreview | null;
};

export function ActivateAccountForm({ invitation }: ActivateAccountFormProps) {
  return (
    <>
      {invitation && <InvitationCard invitation={invitation} />}

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
          label="CREAR CONTRASEÑA"
          type="password"
          autoComplete="new-password"
        />
      </div>

      <PhotoConsentCheckbox />

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
