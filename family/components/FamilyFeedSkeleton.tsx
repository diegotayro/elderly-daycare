import { SkeletonBlock } from "@/shared/components/SkeletonBlock";

const SKELETON_CHIPS_COUNT = 3;
const SKELETON_CARDS_COUNT = 3;

export function FamilyFeedSkeleton() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-[720px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20"
    >
      <span className="sr-only">Cargando el feed de tu familia</span>
      <header className="mb-5">
        <SkeletonBlock className="mb-1 h-[17px] w-24 rounded-md" />
        <SkeletonBlock className="h-9 w-48 rounded-lg" />
        <SkeletonBlock className="mt-[5px] h-5 w-40 rounded-md" />
      </header>
      <div className="mb-[22px] flex flex-wrap gap-2.5">
        {Array.from({ length: SKELETON_CHIPS_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className="h-[42px] w-28 rounded-full" />
        ))}
      </div>
      <SkeletonBlock className="mb-3.5 h-[18px] w-52 rounded-md" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: SKELETON_CARDS_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className="h-40 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
