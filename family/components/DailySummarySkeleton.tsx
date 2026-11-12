import { SkeletonBlock } from "@/shared/components/SkeletonBlock";

const SKELETON_CHIPS_COUNT = 2;
const SKELETON_STATS_COUNT = 3;
const SKELETON_HIGHLIGHTS_COUNT = 3;

export function DailySummarySkeleton() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-[700px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20"
    >
      <span className="sr-only">Cargando el resumen del día</span>
      <div className="mb-[22px] flex flex-wrap gap-2.5">
        {Array.from({ length: SKELETON_CHIPS_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className="h-[42px] w-28 rounded-full" />
        ))}
      </div>
      <SkeletonBlock className="mb-[22px] h-36 rounded-[22px]" />
      <div className="mb-[18px] grid grid-cols-3 gap-2.5 lg:gap-3.5">
        {Array.from({ length: SKELETON_STATS_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className="h-[129px] rounded-[18px]" />
        ))}
      </div>
      <SkeletonBlock className="mb-6 h-[78px] rounded-2xl" />
      <SkeletonBlock className="mb-3.5 h-[18px] w-52 rounded-md" />
      <div className="flex flex-col gap-[18px]">
        {Array.from({ length: SKELETON_HIGHLIGHTS_COUNT }, (_, index) => (
          <div key={index} className="flex items-start gap-3.5">
            <SkeletonBlock className="size-[38px] flex-none rounded-full" />
            <div className="flex-1">
              <SkeletonBlock className="h-5 w-3/5 rounded-md" />
              <SkeletonBlock className="mt-1.5 h-4 w-4/5 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
