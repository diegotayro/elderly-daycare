import type { AvatarTone } from "@/elderly/avatar-tones";
import type { FeedPhoto } from "@/feed/types";
import type {
  PostAudience,
  PostType,
  RelationshipType,
} from "@/shared/database/types";

export type FamilyElderly = {
  id: string;
  firstName: string; // "Luis" (chip)
  fullName: string; // "Luis Fernández"
  displayName: string; // "Don Luis", fijo en el mock
  initial: string; // "L"
  tone: AvatarTone; // "blue"
  ageLabel: string; // "78 años", fijo en el mock
  roomName: string; // "Roble"
  photoConsent: boolean;
};

export type FamilyPost = {
  id: string;
  type: PostType;
  audience: PostAudience;
  roomId: string | null; // para el filtro
  roomName: string | null; // "Roble"
  roomElderlyNames: string[]; // solo en room: nombres de pila de sus vinculados en esa habitación
  elderlyIds: string[]; // solo los etiquetados que el familiar puede leer
  heading: string; // "Luis" | título | "Habitación Roble"
  time: string; // "14:20"
  authorLabel: string; // "Cuidador/a Caro"
  body: string;
  photos: FeedPhoto[];
  reactionCount: number;
  commentCount: number;
};

export type FamilyFeedElderly = Pick<
  FamilyElderly,
  "id" | "firstName" | "initial" | "tone"
> & {
  roomId: string;
};

export type SummaryHighlight = {
  id: string;
  type: PostType; // define el color
  title: string; // "¡Caminó sin su andador!"
  time: string; // "14:20"
  detail: string; // "Un gran paso, estaba feliz de contarlo."
};

export type DailySummary = {
  elderlyId: string;
  dateLabel: string; // "martes 17 de junio"
  mealsCount: number;
  sleepMinutes: number; // como daily_summaries.sleep_minutes
  momentsCount: number;
  mood: string; // "Contento y participativo"
  highlights: SummaryHighlight[];
};

export type ElderlyFilter =
  { kind: "all" } | { kind: "elderly"; elderlyId: string };

export type FamilyMock = {
  relationshipLabel: string; // "Hija", de relationshipLabels (solo perfil de "Mi cuenta")
  elderly: FamilyElderly[];
  summaries: DailySummary[];
};

export type SidebarElderlyLink = {
  firstName: string;
  relationship: RelationshipType;
};
