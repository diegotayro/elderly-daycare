import type { FeedDay, FeedPost } from "../types";
import { PostCard } from "./PostCard";

type FeedDaySectionProps = {
  day: FeedDay<FeedPost>;
};

export function FeedDaySection({ day }: FeedDaySectionProps) {
  return (
    <section className="mb-7">
      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-label">
          {day.label}
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      {day.posts.length === 0 ? (
        <p className="m-0 text-[14.5px] text-muted">Sin publicaciones.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {day.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
