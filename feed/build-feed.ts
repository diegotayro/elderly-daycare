import type { Elderly, Post, PostPhoto } from "@/shared/database/types";
import { buildDayLabel } from "./build-day-label";
import type {
  FeedDataDay,
  FeedDataPage,
  FeedDay,
  FeedPage,
  FeedPost,
  FeedPostData,
  FeedSource,
} from "./types";

const timeFormatter = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

// Tratamiento fijo y provisional: el esquema no tiene columna para esto.
const displayName = (elderly: Elderly) => `Don ${elderly.first_name}`;

const toCaption = (photo: PostPhoto) => {
  const fileName = photo.url.split("/").pop() ?? "";
  const nameWithoutExtension = fileName.replace(/\.[^.]+$/, "");
  return `Foto · ${nameWithoutExtension.replaceAll("-", " ")}`;
};

export function buildFeed(source: FeedSource): FeedPost[] {
  const elderlyById = new Map(source.elderly.map((e) => [e.id, e]));
  const roomsById = new Map(source.rooms.map((r) => [r.id, r]));

  const taggedElderly = (post: Post) =>
    source.postElderly
      .filter((link) => link.post_id === post.id)
      .map((link) => elderlyById.get(link.elderly_id))
      .filter((e): e is Elderly => e !== undefined);

  const firstPhoto = (post: Post) =>
    source.postPhotos
      .filter((photo) => photo.post_id === post.id)
      .sort((a, b) => a.position - b.position)[0];

  const toRecipientLabel = (post: Post, names: string) => {
    if (post.audience === "elderly") return `familia de ${names}`;
    if (post.audience === "room") {
      return `habitación ${roomsById.get(post.room_id ?? "")?.name ?? ""}`;
    }
    return "toda la guardería";
  };

  const toFeedPost = (post: Post): FeedPost => {
    const tagged = taggedElderly(post);
    const names = tagged.map(displayName).join(", ");
    const photo = firstPhoto(post);
    const counts = source.postCounts[post.id] ?? { reactions: 0, comments: 0 };

    return {
      id: post.id,
      type: post.type,
      heading: post.audience === "elderly" ? names : (post.title ?? ""),
      avatarInitial:
        post.audience === "elderly" ? (tagged[0]?.first_name[0] ?? null) : null,
      time: timeFormatter.format(new Date(post.published_at)),
      publishedByMe: post.author_id === source.currentUser.id,
      recipientLabel: toRecipientLabel(post, names),
      body: post.body,
      photoCaption: photo ? toCaption(photo) : null,
      photos: [],
      reactionCount: counts.reactions,
      commentCount: counts.comments,
    };
  };

  return [...source.posts]
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .map(toFeedPost);
}

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

function displayNameOf(firstName: string): string {
  return `Don ${firstName}`;
}

function toFeedPostFromData(
  post: FeedPostData,
  currentUserId: string,
): FeedPost {
  // Solo los etiquetados que el usuario puede leer por RLS
  const names = post.elderly.map(({ firstName }) => displayNameOf(firstName));
  // Si ninguno es legible (por RLS), se usa un texto genérico en vez de dejar el encabezado vacío
  const namesLabel = names.join(", ");

  const headings = {
    elderly: namesLabel || "Adulto mayor",
    room: post.title ?? `Habitación ${post.roomName ?? ""}`.trim(),
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
    photoCaption: null,
    photos: post.photos,
    reactionCount: post.reactionCount,
    commentCount: post.commentCount,
  };
}

function toFeedDay(day: FeedDataDay, context: FeedContext): FeedDay<FeedPost> {
  return {
    date: day.date,
    label: buildDayLabel(day.date, context.today, "team"),
    posts: day.posts.map((post) =>
      toFeedPostFromData(post, context.currentUserId),
    ),
  };
}

export function buildFeedDays(
  page: FeedDataPage,
  context: FeedContext,
): FeedPage<FeedPost> {
  return {
    days: page.days.map((day) => toFeedDay(day, context)),
    hasMore: page.hasMore,
  };
}
