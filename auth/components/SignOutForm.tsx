import type { ReactNode } from "react";
import { signOut } from "@/auth/actions/sign-out";

type SignOutFormProps = {
  className: string;
  title?: string;
  children: ReactNode;
};

export function SignOutForm({ className, title, children }: SignOutFormProps) {
  return (
    <form action={signOut}>
      <button type="submit" title={title} className={className}>
        {children}
      </button>
    </form>
  );
}
