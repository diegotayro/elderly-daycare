import { SkeletonBlock } from "@/shared/components/SkeletonBlock";

const SKELETON_CARDS_COUNT = 3;

export function FeedSkeleton() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-[760px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20"
    >
      <span className="sr-only">Cargando el feed</span>
      <header className="mb-6">
        <SkeletonBlock className="mb-1 h-[17px] w-44 rounded-md" />
        <SkeletonBlock className="h-9 w-56 rounded-lg" />
        <SkeletonBlock className="mt-[5px] h-5 w-64 rounded-md" />
      </header>
      <SkeletonBlock className="mb-6 h-[70px] rounded-[18px]" />
      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-label">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: SKELETON_CARDS_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className="h-40 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
