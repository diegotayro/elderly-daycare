import type { FeedPage } from "@/feed/types";
import type { FamilyFeedElderly, FamilyPost } from "../types";
import { FamilyFeedList } from "./FamilyFeedList";

type FamilyFeedViewProps = {
  firstName: string;
  elderly: FamilyFeedElderly[];
  initialPage: FeedPage<FamilyPost>;
};

export function FamilyFeedView({
  firstName,
  elderly,
  initialPage,
}: FamilyFeedViewProps) {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-5">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-strong">
          TU FAMILIA
        </div>
        <h1 className="m-0 font-display text-2xl leading-[normal] font-semibold text-ink lg:text-[30px]">
          Hola, {firstName}
        </h1>
        <p className="mt-[5px] text-[14.5px] text-muted-strong">
          Así va el día de hoy
        </p>
      </header>
      <FamilyFeedList elderly={elderly} initialPage={initialPage} />
    </div>
  );
}
