import { buildDayLabel } from "@/feed/build-day-label";
import { buildPostHeading } from "@/feed/build-post-heading";
import type {
  FeedDataDay,
  FeedDataPage,
  FeedDay,
  FeedPage,
  FeedPostData,
} from "@/feed/types";
import { userRoleLabels } from "@/users/user-role-labels";
import type { FamilyFeedElderly, FamilyPost } from "./types";

const limaTimeFormatter = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Lima",
});

type FamilyFeedContext = {
  today: string; // "aaaa-mm-dd" en Lima
  elderly: FamilyFeedElderly[]; // los vinculados del familiar
};

function buildAuthorLabel(post: FeedPostData): string {
  if (!post.authorRole || !post.authorFirstName) return "Equipo";
  return `${userRoleLabels[post.authorRole]} ${post.authorFirstName}`;
}

function toFamilyPost(
  post: FeedPostData,
  context: FamilyFeedContext,
): FamilyPost {
  // Los nombres salen de los vínculos del familiar, no de otra consulta
  const roomElderlyNames =
    post.audience === "room"
      ? context.elderly
          .filter((elderly) => elderly.roomId === post.roomId)
          .map((elderly) => elderly.firstName)
      : [];

  return {
    id: post.id,
    type: post.type,
    audience: post.audience,
    roomId: post.roomId,
    roomName: post.roomName,
    roomElderlyNames,
    elderlyIds: post.elderly.map((elderly) => elderly.id),
    heading: buildPostHeading(post),
    time: limaTimeFormatter.format(new Date(post.publishedAt)),
    authorLabel: buildAuthorLabel(post),
    body: post.body,
    photos: post.photos,
    reactionCount: post.reactionCount,
    reactedByMe: post.reactedByMe,
    commentCount: post.commentCount,
  };
}

function toFamilyDay(
  day: FeedDataDay,
  context: FamilyFeedContext,
): FeedDay<FamilyPost> {
  return {
    date: day.date,
    label: buildDayLabel(day.date, context.today, "family"),
    posts: day.posts.map((post) => toFamilyPost(post, context)),
  };
}

export function buildFamilyFeed(
  page: FeedDataPage,
  context: FamilyFeedContext,
): FeedPage<FamilyPost> {
  return {
    days: page.days.map((day) => toFamilyDay(day, context)),
    hasMore: page.hasMore,
  };
}
