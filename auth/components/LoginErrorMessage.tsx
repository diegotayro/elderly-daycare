import { loginErrorMessages } from "@/auth/login-error-messages";
import type { LoginErrorCode } from "@/auth/types";

type LoginErrorMessageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

function isLoginErrorCode(value: unknown): value is LoginErrorCode {
  return typeof value === "string" && value in loginErrorMessages;
}

export async function LoginErrorMessage({
  searchParams,
}: LoginErrorMessageProps) {
  const { error } = await searchParams;
  if (!isLoginErrorCode(error)) return null;

  return (
    <p role="alert" className="mb-5 text-[14px] text-ink">
      {loginErrorMessages[error]}
    </p>
  );
}
