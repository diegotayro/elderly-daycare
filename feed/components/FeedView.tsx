import { FeedHeader } from "./FeedHeader";
import { PostComposerLink } from "./PostComposerLink";
import type { FeedSource } from "../types";

type FeedViewProps = {
  source: FeedSource;
};

export function FeedView({ source }: FeedViewProps) {
  const { daycare, currentUser, elderlyCount, todayLabel } = source;

  return (
    <div className="mx-auto w-full max-w-[760px] px-10 pt-[34px] pb-20">
      <FeedHeader
        daycareName={daycare.name}
        userFirstName={currentUser.first_name}
        elderlyCount={elderlyCount}
        todayLabel={todayLabel}
      />
      <PostComposerLink userInitial={currentUser.first_name[0]} />
      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-label">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>
    </div>
  );
}
