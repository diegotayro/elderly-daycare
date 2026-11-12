import Link from "next/link";
import { SunIcon } from "../icons/SunIcon";
import { navVariants, type NavVariant } from "./nav-items";

type BrandLinkProps = {
  variant: NavVariant;
  daycareName?: string;
  className?: string;
};

export function BrandLink({
  variant,
  daycareName,
  className = "",
}: BrandLinkProps) {
  const { homeHref, brandSubtitle } = navVariants[variant];

  return (
    <Link
      href={homeHref}
      className={`flex items-center gap-[11px] ${className}`}
    >
      <div className="flex size-[38px] flex-none items-center justify-center rounded-xl bg-linear-155 from-[#F8C3A8] to-coral text-white">
        <SunIcon size={21} />
      </div>
      <div>
        <div className="font-display text-[17px] leading-none font-semibold text-ink">
          {daycareName}
        </div>
        <div className="mt-0.5 text-[11.5px] text-muted">{brandSubtitle}</div>
      </div>
    </Link>
  );
}
