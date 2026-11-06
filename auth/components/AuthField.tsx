import type { InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  inputClassName?: string;
};

export function AuthField({
  id,
  label,
  inputClassName = "text-[15px]",
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
        className={`w-full rounded-[14px] border-[1.5px] border-field-line bg-white px-4 py-3.5 text-ink outline-none placeholder:text-placeholder focus:border-field-focus ${inputClassName}`}
        {...inputProps}
      />
    </>
  );
}
