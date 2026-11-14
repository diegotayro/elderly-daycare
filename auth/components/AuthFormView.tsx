import type { ReactNode } from "react";
import { AuthBrandMark } from "./AuthBrandMark";

type AuthFormViewProps = {
  title: string;
  description: string;
  children: ReactNode;
};

// Contenedor y encabezado compartidos por /activate-account y /create-password
export function AuthFormView({
  title,
  description,
  children,
}: AuthFormViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 lg:p-10">
      <div className="w-full max-w-[440px]">
        <AuthBrandMark className="mb-[22px]" />
        <h1 className="mb-2 font-display text-[32px] leading-[1.15] font-semibold text-ink">
          {title}
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
          {description}
        </p>
        {children}
      </div>
    </div>
  );
}
