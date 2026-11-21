import { SkeletonBlock } from "@/shared/components/SkeletonBlock";

const SKELETON_COMMENTS_COUNT = 2;

export function PostDetailSkeleton() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-10"
    >
      <span className="sr-only">Cargando la publicación</span>
      <SkeletonBlock className="mb-[18px] h-5 w-32 rounded-md" />
      <SkeletonBlock className="h-72 rounded-[22px]" />
      <SkeletonBlock className="mt-6 mb-3.5 h-4 w-36 rounded-md" />
      <div className="flex flex-col gap-3.5">
        {Array.from({ length: SKELETON_COMMENTS_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className="h-16 rounded-[14px]" />
        ))}
      </div>
    </div>
  );
}
