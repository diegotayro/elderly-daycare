import type { AvatarTone } from "@/elderly/avatar-tones";
import type { PostType, RelationshipType } from "@/shared/database/types";

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
  elderlyIds: string[]; // vacío = anuncio general, visible con cualquier filtro
  heading: string; // "Don Luis" | "Anuncio general"
  time: string; // "14:20"
  authorLabel: string; // "Cuidador/a Caro"
  body: string;
  photoCaption: string | null; // "Foto · taller de pintura"
  reactionCount: number;
  commentCount: number;
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
  todayLabel: string; // "MARTES 17 JUN"
  elderly: FamilyElderly[];
  posts: FamilyPost[];
  summaries: DailySummary[];
};

export type SidebarElderlyLink = {
  firstName: string;
  relationship: RelationshipType;
};
