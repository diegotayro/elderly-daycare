import { buildDayLabel } from "./build-day-label";
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

// Tratamiento fijo y provisional: el esquema no tiene columna para esto.
function displayNameOf(firstName: string): string {
  return `Don ${firstName}`;
}

function toFeedPost(post: FeedPostData, currentUserId: string): FeedPost {
  // Solo los etiquetados que el usuario puede leer por RLS
  const namesLabel = post.elderly
    .map(({ firstName }) => displayNameOf(firstName))
    .join(", ");
  const roomLabel = `Habitación ${post.roomName ?? ""}`.trim();

  // Si ninguno es legible, se usa un texto genérico en vez de dejar el encabezado vacío
  const headings = {
    elderly: namesLabel || "Adulto mayor",
    room: post.title ?? roomLabel,
    daycare: post.title ?? "Toda la guardería",
  };
  const recipients = {
    elderly: namesLabel ? `familia de ${namesLabel}` : "familia",
    room: `habitación ${post.roomName ?? ""}`.trim(),
    daycare: "toda la guardería",
  };

  return {
    id: post.id,
    type: post.type,
    heading: headings[post.audience],
    avatarInitial:
      post.audience === "elderly"
        ? (post.elderly[0]?.firstName[0]?.toUpperCase() ?? null)
        : null,
    time: limaTimeFormatter.format(new Date(post.publishedAt)),
    publishedByMe: post.authorId === currentUserId,
    recipientLabel: recipients[post.audience],
    body: post.body,
    photos: post.photos,
    reactionCount: post.reactionCount,
    commentCount: post.commentCount,
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
