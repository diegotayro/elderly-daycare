import { NewPostTrigger } from "@/feed/components/NewPostTrigger";
import { PlusIcon } from "../icons/PlusIcon";
import { BrandLink } from "./BrandLink";

type MobileTopBarProps = {
  daycareName?: string;
};

export function MobileTopBar({ daycareName }: MobileTopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-2.5 lg:hidden">
      <BrandLink daycareName={daycareName} />
      <NewPostTrigger
        aria-label="Nueva publicación"
        className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-linear-to-b from-[#F4977E] to-[#EE8164] text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
      >
        <PlusIcon size={20} />
      </NewPostTrigger>
    </header>
  );
}
