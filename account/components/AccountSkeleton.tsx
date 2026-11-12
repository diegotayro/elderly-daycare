import { SkeletonBlock } from "@/shared/components/SkeletonBlock";
import { AccountTitle } from "./AccountTitle";

type AccountSkeletonProps = {
  withElderlyCard?: boolean;
};

export function AccountSkeleton({
  withElderlyCard = false,
}: AccountSkeletonProps) {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20"
    >
      <span className="sr-only">Cargando mi cuenta</span>
      <header className="mb-[22px]">
        <AccountTitle />
      </header>
      <SkeletonBlock className="mb-[18px] h-[106px] rounded-[18px]" />
      {withElderlyCard && (
        <SkeletonBlock className="mb-[18px] h-[169px] rounded-[18px]" />
      )}
      <SkeletonBlock className="mb-[18px] h-[150px] rounded-[18px]" />
      <SkeletonBlock className="mb-[18px] h-[107px] rounded-[18px]" />
      <SkeletonBlock className="h-[50px] rounded-[14px]" />
    </div>
  );
}
