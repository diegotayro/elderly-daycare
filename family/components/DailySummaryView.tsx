import type { ReactNode } from "react";
import type { FamilyFeedElderly } from "../types";
import { ElderlyFilterChips } from "./ElderlyFilterChips";

type DailySummaryViewProps = {
  elderly: FamilyFeedElderly[];
  selectedId: string;
  children: ReactNode;
};

// Los chips cambian el adulto mayor por URL y quitan la fecha (se muestra su último resumen)
export function DailySummaryView({
  elderly,
  selectedId,
  children,
}: DailySummaryViewProps) {
  const hrefById = Object.fromEntries(
    elderly.map(({ id }) => [id, `/family/summary?elderly=${id}`]),
  );

  return (
    <div className="mx-auto w-full max-w-[700px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      {elderly.length > 1 && (
        <ElderlyFilterChips
          elderly={elderly}
          selectedId={selectedId}
          hrefById={hrefById}
        />
      )}
      {children}
    </div>
  );
}
