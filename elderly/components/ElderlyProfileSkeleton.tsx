import { SkeletonBlock } from "@/shared/components/SkeletonBlock";

export function ElderlyProfileSkeleton() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-[820px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20"
    >
      <span className="sr-only">Cargando perfil</span>
      <SkeletonBlock className="mb-5 h-[18px] w-48 rounded-md" />
      <div className="flex flex-col gap-[26px] lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-[18px] lg:min-w-[300px]">
          <div className="flex items-center gap-[18px]">
            <SkeletonBlock className="size-[84px] flex-none rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <SkeletonBlock className="h-7 w-3/5 rounded-md" />
              <SkeletonBlock className="h-4 w-2/5 rounded-md" />
            </div>
          </div>
          <SkeletonBlock className="h-[132px] rounded-2xl" />
        </div>
        <div className="flex w-full flex-col gap-3.5 lg:w-[300px] lg:flex-none">
          <SkeletonBlock className="h-[46px] rounded-[14px]" />
          <SkeletonBlock className="h-[188px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
