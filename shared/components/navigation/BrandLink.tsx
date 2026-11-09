import Link from "next/link";
import { SunIcon } from "../icons/SunIcon";

type BrandLinkProps = {
  daycareName?: string;
  className?: string;
};

export function BrandLink({ daycareName, className = "" }: BrandLinkProps) {
  return (
    <Link href="/" className={`flex items-center gap-[11px] ${className}`}>
      <div className="flex size-[38px] flex-none items-center justify-center rounded-xl bg-linear-155 from-[#F8C3A8] to-coral text-white">
        <SunIcon size={21} />
      </div>
      <div>
        <div className="font-display text-[17px] leading-none font-semibold text-ink">
          {daycareName}
        </div>
        <div className="mt-0.5 text-[11.5px] text-muted">Personal</div>
      </div>
    </Link>
  );
}
