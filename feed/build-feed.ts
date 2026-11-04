import type { Elderly, Post, PostPhoto } from "@/shared/database/types";
import type { FeedPost, FeedSource } from "./types";

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
      reactionCount: counts.reactions,
      commentCount: counts.comments,
    };
  };

  return [...source.posts]
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .map(toFeedPost);
}
