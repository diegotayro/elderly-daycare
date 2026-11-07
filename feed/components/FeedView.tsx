import { buildFeed } from "../build-feed";
import { FeedHeader } from "./FeedHeader";
import { PostCard } from "./PostCard";
import { PostComposerButton } from "./PostComposerButton";
import type { FeedSource } from "../types";

type FeedViewProps = {
  source: FeedSource;
};

export function FeedView({ source }: FeedViewProps) {
  const { daycare, currentUser, elderlyCount, todayLabel } = source;
  const posts = buildFeed(source);

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <FeedHeader
        daycareName={daycare.name}
        userFirstName={currentUser.first_name}
        elderlyCount={elderlyCount}
        todayLabel={todayLabel}
      />
      <PostComposerButton userInitial={currentUser.first_name[0]} />
      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-label">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
