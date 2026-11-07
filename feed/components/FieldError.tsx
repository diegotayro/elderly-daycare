import { getFieldErrorId } from "@/elderly/components/FormField";

type FieldErrorProps = {
  fieldId: string;
  message?: string | null;
};

export function FieldError({ fieldId, message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      id={getFieldErrorId(fieldId)}
      className="mt-1.5 text-[13px] font-bold text-error"
    >
      {message}
    </p>
  );
}
