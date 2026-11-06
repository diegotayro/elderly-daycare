import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

export const fieldControlClassName =
  "w-full rounded-[14px] border-[1.5px] border-field-line bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-placeholder focus:border-field-focus aria-[invalid=true]:border-error";

export function getFieldErrorId(fieldId: string): string {
  return `${fieldId}-error`;
}

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-extrabold tracking-[0.7px] text-muted-strong"
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          id={getFieldErrorId(id)}
          className="mt-1.5 text-[13px] font-bold text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
