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
