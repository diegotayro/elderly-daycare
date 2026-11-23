import { buildAuthorLabel } from "./build-author-label";
import { buildDayLabel } from "./build-day-label";
import { buildPostHeading, joinElderlyNames } from "./build-post-heading";
import type {
  FeedDataDay,
  FeedDataPage,
  FeedDay,
  FeedPage,
  FeedPost,
  FeedPostData,
} from "./types";

const limaTimeFormatter = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Lima",
});

type FeedContext = {
  currentUserId: string;
  today: string; // "aaaa-mm-dd" en Lima
};

export function toFeedPost(post: FeedPostData, currentUserId: string): FeedPost {
  const namesLabel = joinElderlyNames(post.elderly);
  const roomName = post.roomName ?? "";

  const recipients = {
    elderly: namesLabel ? `familia de ${namesLabel}` : "familia",
    room: `habitación ${roomName}`.trim(),
    daycare: "toda la guardería",
  };

  return {
    id: post.id,
    type: post.type,
    heading: buildPostHeading(post),
    avatarInitial:
      post.audience === "elderly"
        ? (post.elderly[0]?.firstName[0]?.toUpperCase() ?? null)
        : null,
    time: limaTimeFormatter.format(new Date(post.publishedAt)),
    publishedByMe: post.authorId === currentUserId,
    authorLabel: buildAuthorLabel(post),
    recipientLabel: recipients[post.audience],
    body: post.body,
    photos: post.photos,
    reactionCount: post.reactionCount,
    reactedByMe: post.reactedByMe,
    commentCount: post.commentCount,
    canDelete: false,
  };
}

function toFeedDay(day: FeedDataDay, context: FeedContext): FeedDay<FeedPost> {
  return {
    date: day.date,
    label: buildDayLabel(day.date, context.today, "team"),
    posts: day.posts.map((post) => toFeedPost(post, context.currentUserId)),
  };
}

export function buildFeed(
  page: FeedDataPage,
  context: FeedContext,
): FeedPage<FeedPost> {
  return {
    days: page.days.map((day) => toFeedDay(day, context)),
    hasMore: page.hasMore,
  };
}
