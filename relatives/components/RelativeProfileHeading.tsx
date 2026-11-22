import Link from "next/link";
import { ChevronLeftIcon } from "@/shared/components/icons/ChevronLeftIcon";

type RelativeProfileHeadingProps = {
  fullName: string;
  backHref: string; // perfil del adulto mayor desde donde se entró
};

export function RelativeProfileHeading({
  fullName,
  backHref,
}: RelativeProfileHeadingProps) {
  return (
    <>
      <Link
        href={backHref}
        className="mb-5 flex items-center gap-[7px] text-sm leading-[normal] font-bold text-muted-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        <ChevronLeftIcon size={18} />
        Volver al perfil
      </Link>
      <h1 className="m-0 font-display text-2xl leading-[normal] font-semibold text-ink lg:text-[30px]">
        {fullName}
      </h1>
    </>
  );
}
