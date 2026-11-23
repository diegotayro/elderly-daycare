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

// Adulto mayor vinculado al familiar, para la tarjeta de "Mi cuenta" (de cualquier estado)
export type FamilyAccountElderly = {
  id: string;
  fullName: string; // "Luis Fernández"
  initial: string; // "L"
  tone: AvatarTone;
  ageLabel: string; // "78 años"
  roomName: string; // "Roble"
  photoConsent: boolean;
  isArchived: boolean;
  relationship: RelationshipType; // del vínculo de este familiar con él
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
  subtitle: string; // "14:20 · Cuidador/a Caro" | "Para Luis, Jorge · 14:20 · Cuidador/a Caro"
  time: string; // "14:20"
  authorLabel: string; // "Cuidador/a Caro"
  body: string;
  photos: FeedPhoto[];
  reactionCount: number;
  reactedByMe: boolean;
  commentCount: number;
};

export type FamilyFeedElderly = Pick<
  FamilyElderly,
  "id" | "firstName" | "initial" | "tone"
> & {
  roomId: string;
};

export type ElderlyFilter =
  { kind: "all" } | { kind: "elderly"; elderlyId: string };

export type SidebarElderlyLink = {
  firstName: string;
  relationship: RelationshipType;
};
