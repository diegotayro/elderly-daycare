import { SkeletonBlock } from "@/shared/components/SkeletonBlock";
import { NoticesTitle } from "./NoticesTitle";

const SKELETON_CARDS_COUNT = 4;

export function NoticesSkeleton() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20"
    >
      <span className="sr-only">Cargando avisos</span>
      <header className="mb-[22px]">
        <NoticesTitle />
      </header>
      <div className="flex flex-col gap-3">
        {Array.from({ length: SKELETON_CARDS_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className="h-[74px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
