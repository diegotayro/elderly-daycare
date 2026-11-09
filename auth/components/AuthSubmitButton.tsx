import type { ReactNode } from "react";
import { authSubmitClassName } from "./auth-submit-styles";

export function AuthSubmitButton({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className={authSubmitClassName}>
      {children}
    </button>
  );
}
