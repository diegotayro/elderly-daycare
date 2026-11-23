"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/shared/components/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import type { SummaryDayNav as SummaryDayNavData } from "../types";

type SummaryDayNavProps = {
  nav: SummaryDayNavData;
  day: string; // "aaaa-mm-dd" mostrado
  basePath: string;
  extraParams?: Record<string, string>; // p. ej. ?elderly= en la vista familiar
};

const arrowClassName =
  "flex size-9 items-center justify-center rounded-full bg-surface text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong";

export function SummaryDayNav({
  nav,
  day,
  basePath,
  extraParams = {},
}: SummaryDayNavProps) {
  const router = useRouter();

  function buildHref(targetDay: string): string {
    const params = new URLSearchParams({ ...extraParams, date: targetDay });
    return `${basePath}?${params}`;
  }

  function renderArrow(
    targetDay: string | null,
    label: string,
    icon: React.ReactNode,
  ) {
    if (!targetDay) {
      return (
        <span
          role="img"
          aria-label={`${label} (no disponible)`}
          className={`${arrowClassName} opacity-40`}
        >
          {icon}
        </span>
      );
    }
    return (
      <Link
        href={buildHref(targetDay)}
        aria-label={label}
        className={arrowClassName}
      >
        {icon}
      </Link>
    );
  }

  return (
    <nav
      aria-label="Navegación entre días"
      className="mt-4 flex flex-wrap items-center gap-2.5"
    >
      {renderArrow(
        nav.previousDay,
        "Resumen anterior",
        <ChevronLeftIcon size={18} />,
      )}
      {renderArrow(
        nav.nextDay,
        "Resumen siguiente",
        <ChevronRightIcon size={18} />,
      )}
      <label className="flex items-center gap-2 text-[13px] font-bold text-summary-hero-date">
        Ir a
        <input
          type="date"
          value={day}
          max={nav.maxDay}
          onChange={(event) => {
            if (event.target.value) router.push(buildHref(event.target.value));
          }}
          className="rounded-full bg-surface px-3 py-1.5 text-[13px] font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
        />
      </label>
    </nav>
  );
}
