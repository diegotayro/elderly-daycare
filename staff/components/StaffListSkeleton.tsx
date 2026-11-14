import { SkeletonBlock } from "@/shared/components/SkeletonBlock";
import { StaffListTitle } from "./StaffListTitle";

const SKELETON_CARDS_COUNT = 4;

export function StaffListSkeleton() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-[880px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20"
    >
      <span className="sr-only">Cargando staff</span>
      <header className="mb-[22px]">
        <StaffListTitle />
      </header>
      <SkeletonBlock className="mb-[22px] h-[47px] rounded-[14px]" />
      <SkeletonBlock className="mb-3.5 h-[18px] w-48 rounded-md" />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {Array.from({ length: SKELETON_CARDS_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className="h-20 rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}
