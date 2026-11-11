"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { activateAccount } from "@/auth/actions/activate-account";
import { activateAccountMessages as messages } from "@/auth/activate-account-messages";
import { readActivateAccountInput } from "@/auth/read-activate-account-input";
import type {
  ActivateAccountErrors,
  ActivateAccountField,
  ActivateAccountResult,
  InvitationPreview,
  PasswordMode,
} from "@/auth/types";
import { validateActivateAccount } from "@/auth/validate-activate-account";
import { AuthField } from "./AuthField";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { InvitationCard } from "./InvitationCard";
import { PhotoConsentCheckbox } from "./PhotoConsentCheckbox";

const FIELD_ORDER: ActivateAccountField[] = ["code", "email", "password"];

const PASSWORD_LABELS: Record<PasswordMode, string> = {
  create: "CREAR CONTRASEÑA",
  existing: "INGRESE SU CONTRASEÑA",
};

type ActivateAccountFormProps = {
  invitation: InvitationPreview | null;
  disabled?: boolean; // fallback de Suspense: mismo formulario mientras llega la invitación
};

export function ActivateAccountForm({
  invitation,
  disabled,
}: ActivateAccountFormProps) {
  const [errors, setErrors] = useState<ActivateAccountErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [passwordMode, setPasswordMode] = useState<PasswordMode>(
    invitation?.hasAccount ? "existing" : "create",
  );
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  // Los campos siguen deshabilitados mientras se activa: el foco se mueve al terminar
  const mustFocusInvalidField = useRef(false);

  useEffect(() => {
    if (isPending || !mustFocusInvalidField.current) return;
    mustFocusInvalidField.current = false;
    const firstInvalidField = FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalidField) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
        ?.focus();
    }
  }, [isPending, errors]);

  function showResult(result: ActivateAccountResult) {
    mustFocusInvalidField.current = true;
    setPasswordMode(result.passwordMode);
    if (result.status === "invalid") {
      setErrors(result.errors);
      setGeneralError(null);
    } else {
      setErrors({});
      setGeneralError(result.message);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || disabled) return;
    const formData = new FormData(event.currentTarget);
    const clientErrors = validateActivateAccount(
      readActivateAccountInput(formData),
    );
    setGeneralError(null);

    if (Object.keys(clientErrors).length > 0) {
      mustFocusInvalidField.current = true;
      setErrors(clientErrors);
      return;
    }
    setErrors({});

    // Si la acción tiene éxito redirige, así que solo llegan resultados de error
    startTransition(async () => {
      const result = await activateAccount(passwordMode, formData).catch(
        (): ActivateAccountResult => ({
          status: "error",
          message: messages.unexpected, // fallo de red
          passwordMode,
        }),
      );
      showResult(result);
    });
  }

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const field = (event.target as HTMLInputElement)
      .name as ActivateAccountField;
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  const isPasswordExisting = passwordMode === "existing";

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onChange={clearFieldError}
    >
      {invitation && <InvitationCard invitation={invitation} />}

      <fieldset
        disabled={disabled || isPending}
        className="m-0 min-w-0 border-0 p-0"
      >
        <div className="mb-[18px]">
          <AuthField
            id="code"
            label="CÓDIGO DE INVITACIÓN"
            defaultValue={invitation?.code}
            error={errors.code}
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
            error={errors.email}
            autoComplete="email"
          />
        </div>
        <div className="mb-[18px]">
          <AuthField
            id="password"
            label={PASSWORD_LABELS[passwordMode]}
            type="password"
            error={errors.password}
            autoComplete={
              isPasswordExisting ? "current-password" : "new-password"
            }
          />
        </div>

        <PhotoConsentCheckbox />
      </fieldset>

      {generalError && (
        <p role="alert" className="mb-4 text-[14px] font-bold text-error">
          {generalError}
        </p>
      )}
      <AuthSubmitButton disabled={disabled || isPending}>
        {isPending ? "Activando…" : "Activar mi cuenta"}
      </AuthSubmitButton>

      <p className="mt-[22px] text-center text-[14.5px] text-muted-strong">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-extrabold text-coral-link">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
