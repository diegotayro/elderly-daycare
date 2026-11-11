import type { ReactNode } from "react";
import { authSubmitClassName } from "./auth-submit-styles";

type AuthSubmitButtonProps = {
  children: ReactNode;
  disabled?: boolean;
};

export function AuthSubmitButton({
  children,
  disabled,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`${authSubmitClassName} disabled:cursor-default disabled:opacity-70`}
    >
      {children}
    </button>
  );
}
