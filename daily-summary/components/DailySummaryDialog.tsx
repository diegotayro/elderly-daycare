"use client";

import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FormField,
  fieldControlClassName,
  getFieldErrorId,
} from "@/elderly/components/FormField";
import { formDialogClassName } from "@/shared/components/form-dialog-class-name";
import { Toast } from "@/shared/components/toast/Toast";
import type { ToastMessage } from "@/shared/components/toast/types";
import { saveDailySummary } from "../actions/save-daily-summary";
import { MAX_MOOD_LENGTH } from "../daily-summary-limits";
import { dailySummaryMessages as messages } from "../daily-summary-messages";
import type { DailySummaryData, DailySummaryInput } from "../types";
import {
  validateDailySummary,
  type DailySummaryErrors,
  type SummaryIntent,
} from "../validate-daily-summary";

const MINUTES_PER_HOUR = 60;

const errorToast: ToastMessage = {
  tone: "error",
  title: "No pudimos guardar",
  description: messages.saveError,
};

const FIELD_ORDER: (keyof DailySummaryInput)[] = [
  "mood",
  "sleepHours",
  "sleepMinutes",
];

function toInitialInput(data: DailySummaryData): DailySummaryInput {
  const { mood, sleepMinutes } = data;
  return {
    mood: mood ?? "",
    sleepHours:
      sleepMinutes === null
        ? ""
        : String(Math.floor(sleepMinutes / MINUTES_PER_HOUR)),
    sleepMinutes:
      sleepMinutes === null ? "" : String(sleepMinutes % MINUTES_PER_HOUR),
  };
}

function readInput(form: HTMLFormElement): DailySummaryInput {
  const formData = new FormData(form);
  return {
    mood: String(formData.get("mood") ?? ""),
    sleepHours: String(formData.get("sleepHours") ?? ""),
    sleepMinutes: String(formData.get("sleepMinutes") ?? ""),
  };
}

const secondaryButtonClassName =
  "cursor-pointer rounded-[14px] border-[1.5px] border-line bg-surface px-4 py-[11px] text-[15px] font-bold text-nav disabled:cursor-default disabled:opacity-50";
const primaryButtonClassName =
  "cursor-pointer rounded-[14px] bg-coral-strong px-5 py-[11px] text-[15px] font-extrabold text-white disabled:cursor-default disabled:opacity-50";

type DailySummaryDialogProps = {
  elderlyId: string;
  data: DailySummaryData;
};

export function DailySummaryDialog({
  elderlyId,
  data,
}: DailySummaryDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [formKey, setFormKey] = useState(0);
  const [errors, setErrors] = useState<DailySummaryErrors>({});
  const [isPending, startTransition] = useTransition();
  // El evento close llega después de close(): necesita saber si el guardado ya terminó
  const isSavingRef = useRef(false);
  const [toast, setToast] = useState<{
    id: number;
    message: ToastMessage;
  } | null>(null);

  const isSent = data.status.kind === "sent";
  const initialInput = toInitialInput(data);

  function showToast(message: ToastMessage) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  function focusFirstInvalidField(nextErrors: DailySummaryErrors) {
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
        ?.focus();
    }
  }

  function showErrors(nextErrors: DailySummaryErrors) {
    setErrors(nextErrors);
    // Los campos siguen deshabilitados mientras se guarda: se enfoca al siguiente frame
    requestAnimationFrame(() => focusFirstInvalidField(nextErrors));
  }

  function submit(intent: SummaryIntent) {
    if (isPending || !formRef.current) return;
    const input = readInput(formRef.current);
    const clientErrors = validateDailySummary(input, isSent ? "send" : intent);
    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});

    isSavingRef.current = true;
    startTransition(async () => {
      const result = await saveDailySummary(
        elderlyId,
        data.day,
        input,
        intent,
      ).catch((): { status: "error" } => ({ status: "error" })); // fallo de red
      isSavingRef.current = false;

      if (result.status === "invalid") {
        showErrors(result.errors);
      } else if (result.status === "error") {
        showToast(errorToast);
      } else {
        dialogRef.current?.close();
        showToast({ tone: "success", title: result.message });
        router.refresh();
      }
    });
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(isSent ? "send" : "draft");
  }

  function handleDialogClose() {
    // Un segundo Esc puede cerrar el <dialog> aunque se cancele el primero
    if (isSavingRef.current) {
      dialogRef.current?.showModal();
      return;
    }
    setFormKey((key) => key + 1);
    setErrors({});
    // El toast de error vive dentro del <dialog>: se va con él
    setToast((current) => (current?.message.tone === "error" ? null : current));
  }

  function openDialog() {
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>('[name="mood"]')?.focus();
  }

  function clearError(event: FormEvent<HTMLFormElement>) {
    const { name } = event.target as HTMLInputElement;
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function controlProps(field: keyof DailySummaryInput) {
    return {
      id: field,
      name: field,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? getFieldErrorId(field) : undefined,
    };
  }

  const sleepError = errors.sleepHours ?? errors.sleepMinutes;
  const sleepErrorFieldId = errors.sleepHours ? "sleepHours" : "sleepMinutes";

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={primaryButtonClassName}
      >
        {isSent ? "Editar resumen" : "Completar resumen"}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (isSavingRef.current) event.preventDefault();
        }}
        onClose={handleDialogClose}
        className={formDialogClassName}
      >
        <form
          key={`${formKey}-${JSON.stringify(initialInput)}-${data.status.kind}`}
          ref={formRef}
          noValidate
          onSubmit={handleFormSubmit}
          onChange={clearError}
          className="flex min-h-0 flex-1 flex-col"
        >
          <header className="shrink-0 border-b border-line px-[26px] py-5">
            <h2
              id={titleId}
              className="m-0 font-display text-lg leading-[normal] font-semibold text-ink"
            >
              Resumen del día
            </h2>
            <p className="mt-1 mb-0 text-sm text-muted-strong">
              {data.firstName} · {data.dateLabel}
            </p>
          </header>
          <fieldset
            disabled={isPending}
            className="m-0 flex min-h-0 min-w-0 flex-col gap-[18px] overflow-y-auto border-0 px-[26px] py-6"
          >
            <FormField id="mood" label="ÁNIMO DEL DÍA" error={errors.mood}>
              <input
                {...controlProps("mood")}
                defaultValue={initialInput.mood}
                maxLength={MAX_MOOD_LENGTH}
                placeholder="Ej. Contento y participativo"
                className={fieldControlClassName}
              />
            </FormField>
            <FormField id={sleepErrorFieldId} label="SIESTA" error={sleepError}>
              <div className="flex items-center gap-3">
                <label className="flex flex-1 items-center gap-2 text-sm font-bold text-muted-strong">
                  <input
                    {...controlProps("sleepHours")}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={5}
                    defaultValue={initialInput.sleepHours}
                    placeholder="0"
                    className={fieldControlClassName}
                  />
                  h
                </label>
                <label className="flex flex-1 items-center gap-2 text-sm font-bold text-muted-strong">
                  <input
                    {...controlProps("sleepMinutes")}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    defaultValue={initialInput.sleepMinutes}
                    placeholder="0"
                    className={fieldControlClassName}
                  />
                  min
                </label>
              </div>
            </FormField>
          </fieldset>
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-line px-[26px] py-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
              className="mr-auto cursor-pointer text-[15px] font-bold text-muted-strong disabled:cursor-default disabled:opacity-50"
            >
              Cancelar
            </button>
            {isSent ? (
              <button
                type="submit"
                disabled={isPending}
                className={primaryButtonClassName}
              >
                {isPending ? "Guardando…" : "Guardar"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => submit("draft")}
                  disabled={isPending}
                  className={secondaryButtonClassName}
                >
                  Guardar borrador
                </button>
                <button
                  type="button"
                  onClick={() => submit("send")}
                  disabled={isPending}
                  className={primaryButtonClassName}
                >
                  {isPending ? "Enviando…" : "Enviar a familias"}
                </button>
              </>
            )}
          </footer>
        </form>
        {toast?.message.tone === "error" && (
          <Toast
            key={toast.id}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </dialog>
      {toast?.message.tone === "success" && (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
