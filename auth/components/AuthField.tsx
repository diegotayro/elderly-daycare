import type { InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  inputClassName?: string;
  error?: string;
};

export function getAuthFieldErrorId(fieldId: string): string {
  return `${fieldId}-error`;
}

export function AuthField({
  id,
  label,
  inputClassName = "text-[15px]",
  error,
  ...inputProps
}: AuthFieldProps) {
  return (
    <>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold tracking-[0.7px] text-muted-strong"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? getAuthFieldErrorId(id) : undefined}
        className={`w-full rounded-[14px] border-[1.5px] border-field-line bg-white px-4 py-3.5 text-ink outline-none placeholder:text-placeholder focus:border-field-focus aria-[invalid=true]:border-error ${inputClassName}`}
        {...inputProps}
      />
      {error && (
        <p
          id={getAuthFieldErrorId(id)}
          className="mt-1.5 text-[13px] font-bold text-error"
        >
          {error}
        </p>
      )}
    </>
  );
}
