import Link from "next/link";
import type { ReactNode } from "react";
import { authSubmitClassName } from "./auth-submit-styles";

type AuthSubmitLinkProps = {
  href: string;
  children: ReactNode;
};

export function AuthSubmitLink({ href, children }: AuthSubmitLinkProps) {
  return (
    <Link href={href} className={authSubmitClassName}>
      {children}
    </Link>
  );
}
