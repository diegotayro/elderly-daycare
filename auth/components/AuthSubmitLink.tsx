import Link from "next/link";
import type { ReactNode } from "react";

type AuthSubmitLinkProps = {
  href: string;
  children: ReactNode;
};

export function AuthSubmitLink({ href, children }: AuthSubmitLinkProps) {
  return (
    <Link
      href={href}
      className="block w-full rounded-[15px] bg-linear-180 from-[#F4977E] to-[#EE8164] p-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
    >
      {children}
    </Link>
  );
}
