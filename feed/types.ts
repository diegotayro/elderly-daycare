import type {
  Daycare,
  Elderly,
  Post,
  PostElderly,
  PostPhoto,
  PostType,
  Room,
  User,
} from "@/shared/database/types";
import type { AvatarTone } from "@/elderly/avatar-tones";
import type { RoomOption } from "@/elderly/types";

// Lo que devolvería la consulta del feed: filas + agregados (conteos).
export type FeedSource = {
  daycare: Daycare;
  currentUser: User;
  elderlyCount: number;
  todayLabel: string;
  rooms: Room[];
  elderly: Elderly[];
  posts: Post[];
  postElderly: PostElderly[];
  postPhotos: PostPhoto[];
  postCounts: Record<string, { reactions: number; comments: number }>; // por post_id
};

// Modelo de vista que consumen los componentes.
export type FeedPost = {
  id: string;
  type: PostType;
  heading: string; // "Don Luis" | post.title ("Anuncio general")
  avatarInitial: string | null; // "L"; null → ícono megáfono
  time: string; // "14:20"
  publishedByMe: boolean;
  recipientLabel: string; // "familia de Don Luis" | "habitación Roble" | "toda la guardería"
  body: string;
  photoCaption: string | null; // "Foto · taller de pintura"
  reactionCount: number;
  commentCount: number;
};

export type AudienceElderlyOption = {
  id: string;
  firstName: string; // "Luis"
  initial: string; // "L"
  tone: AvatarTone;
  photoConsent: boolean;
};

export type NewPostOptions = {
  elderly: AudienceElderlyOption[];
  rooms: RoomOption[];
  canPostToDaycare: boolean; // solo admin
  roomsWithoutPhotoConsent: string[]; // ids con room_has_elderly_without_photo_consent = true
};

export type AudienceSelection =
  | { kind: "none" }
  | { kind: "elderly"; elderlyIds: string[] }
  | { kind: "room"; roomId: string }
  | { kind: "daycare" };

export type AudienceChip =
  | { kind: "elderly"; elderlyId: string }
  | { kind: "room" }
  | { kind: "daycare" };

export type NewPostInput = {
  audience: AudienceSelection;
  type: string; // valor crudo del FormData
  title: string; // solo cuenta con room o daycare
  body: string;
  photoCount: number;
};

export type NewPostField = "audience" | "type" | "title" | "body" | "photos";
export type NewPostErrors = Partial<Record<NewPostField, string>>;

export type PhotoSelectionResult = {
  accepted: File[];
  error: string | null;
};

export type CompressedPhoto = { blob: Blob; width: number; height: number };

export type FeedPhoto = {
  url: string; // url firmada
  width: number | null;
  height: number | null;
};

export type FeedDay<TPost> = {
  date: string; // "aaaa-mm-dd" (Lima)
  label: string;
  posts: TPost[];
};

export type FeedPage<TPost> = {
  days: FeedDay<TPost>[];
  hasMore: boolean;
};

export type CreatePostResult =
  | { status: "ok"; postId: string }
  | { status: "invalid"; errors: NewPostErrors }
  | { status: "error" };

export type AttachPhotoInput = {
  path: string; // "{postId}/{position}.webp"
  width: number;
  height: number;
};
