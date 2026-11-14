"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { readCreatePasswordInput } from "@/auth/read-create-password-input";
import type { CreatePasswordErrors, CreatePasswordField } from "@/auth/types";
import { validateCreatePassword } from "@/auth/validate-create-password";
import { AuthField } from "./AuthField";
import { AuthSubmitButton } from "./AuthSubmitButton";

const FIELD_ORDER: CreatePasswordField[] = ["password", "passwordConfirmation"];

type CreatePasswordFormProps = {
  email: string;
  disabled?: boolean; // fallback de Suspense: mismo formulario mientras llegan los datos
};

export function CreatePasswordForm({
  email,
  disabled,
}: CreatePasswordFormProps) {
  const [errors, setErrors] = useState<CreatePasswordErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Los campos siguen deshabilitados mientras se guarda: el foco se mueve al terminar
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || disabled) return;
    const clientErrors = validateCreatePassword(
      readCreatePasswordInput(new FormData(event.currentTarget)),
    );
    setGeneralError(null);
    setErrors(clientErrors);

    if (Object.keys(clientErrors).length > 0) {
      mustFocusInvalidField.current = true;
      return;
    }
    // El envío a la acción createStaffPassword se conecta en el paso 7
    setIsPending(false);
  }

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const field = (event.target as HTMLInputElement)
      .name as CreatePasswordField;
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onChange={clearFieldError}
    >
      <fieldset
        disabled={disabled || isPending}
        className="m-0 min-w-0 border-0 p-0"
      >
        <div className="mb-[18px]">
          <AuthField
            id="email"
            label="EMAIL"
            type="email"
            value={email}
            readOnly
            autoComplete="email"
            inputClassName="text-[15px] read-only:text-muted-strong"
          />
        </div>
        <div className="mb-[18px]">
          <AuthField
            id="password"
            label="CREAR CONTRASEÑA"
            type="password"
            error={errors.password}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-[18px]">
          <AuthField
            id="passwordConfirmation"
            label="CONFIRMAR CONTRASEÑA"
            type="password"
            error={errors.passwordConfirmation}
            autoComplete="new-password"
          />
        </div>
      </fieldset>

      {generalError && (
        <p role="alert" className="mb-4 text-[14px] font-bold text-error">
          {generalError}
        </p>
      )}
      <AuthSubmitButton disabled={disabled || isPending}>
        {isPending ? "Creando…" : "Crear contraseña"}
      </AuthSubmitButton>
    </form>
  );
}
