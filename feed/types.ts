import type { PostAudience, PostType, UserRole } from "@/shared/database/types";
import type { CommentView } from "@/comments/types";
import type { AvatarTone } from "@/elderly/avatar-tones";
import type { RoomOption } from "@/elderly/types";

// Modelo de vista que consumen los componentes.
export type FeedPost = {
  id: string;
  type: PostType;
  heading: string; // "Luis" | post.title ("Anuncio general")
  avatarInitial: string | null; // "L"; null → ícono megáfono
  time: string; // "14:20"
  publishedByMe: boolean;
  authorLabel: string; // "Cuidador/a Diego"
  recipientLabel: string; // "familia de Luis" | "habitación Roble" | "toda la guardería"
  body: string;
  photos: FeedPhoto[];
  reactionCount: number;
  reactedByMe: boolean;
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
  position: number; // post_photos.position
};

export type PhotoViewerPost = {
  postId: string;
  heading: string; // "Don Luis"
  subtitle: string; // "09:40 · Cuidador/a Caro" | "09:40 · publicado por ti"
  caption: string; // body del post
};

export type PhotoDownloadResult =
  { status: "ok"; url: string } | { status: "error" };

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

export type SetReactionResult = { status: "ok" } | { status: "error" };

export type AttachPhotoInput = {
  path: string; // "{postId}/{position}.webp"
  width: number;
  height: number;
};

// Publicación leída de la DB (con la sesión: la RLS ya filtró lo que el usuario no ve)
export type FeedPostData = {
  id: string;
  type: PostType;
  audience: PostAudience;
  title: string | null;
  body: string;
  publishedAt: string; // ISO
  authorId: string;
  authorFirstName: string | null;
  authorRole: UserRole | null;
  roomId: string | null;
  roomName: string | null;
  elderly: { id: string; firstName: string }[]; // solo los etiquetados que el usuario puede leer
  photos: FeedPhoto[];
  reactionCount: number;
  reactedByMe: boolean;
  commentCount: number;
};

export type FeedDataDay = { date: string; posts: FeedPostData[] };

export type FeedDataPage = { days: FeedDataDay[]; hasMore: boolean };

// Detalle de una publicación: FeedPost (equipo) o FamilyPost (familiar) más sus comentarios
export type PostDetail<TPost> = {
  post: TPost;
  comments: CommentView[];
};
