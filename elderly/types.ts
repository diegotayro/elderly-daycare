import type {
  Elderly,
  GuardianElderly,
  Invitation,
  Room,
  User,
} from "@/shared/database/types";
import type { AvatarTone } from "./avatar-tones";

// Lo que devolvería la consulta: filas del esquema + datos de UI.
export type ElderlySource = {
  referenceDate: string; // "2025-06-17": "hoy" (Lima) para calcular edades; el mock usa una fecha fija
  rooms: Room[];
  elderly: Elderly[];
  relatives: User[]; // role = relative
  guardianElderly: GuardianElderly[];
  invitations: Invitation[];
  avatarTones: Record<string, AvatarTone>; // por id de elderly, user o invitation; solo UI
};

export type ElderlyIndicator =
  | { kind: "allergy"; label: string } // "MANÍ"
  | { kind: "link" } // "VINCULAR"
  | { kind: "none" } // flecha
  | { kind: "archived" }; // "ARCHIVADO", solo en la sección de archivados

export type ElderlyListItem = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  summary: string; // "78 años · 2 familiares vinculados"
  indicator: ElderlyIndicator;
};

export type ElderlyList = {
  active: ElderlyListItem[];
  archived: ElderlyListItem[]; // vacío si no es admin
};

export type LinkedRelative = {
  id: string; // id de guardian_elderly o invitation
  fullName: string;
  initial: string;
  tone: AvatarTone;
  detail: string; // "Hija · activa" | "Hijo · invitación enviada"
  status: "active" | "pending";
  statusLabel: string; // "ACTIVA" | "ACTIVO" | "PENDIENTE"
};

export type ElderlyProfile = {
  id: string;
  fullName: string;
  firstName: string; // "Luis", para el aviso del modal de vincular
  initial: string;
  tone: AvatarTone;
  subtitle: string; // "78 años · Habitación Roble"
  allergyTags: string[]; // tal como están en la DB: ["Maní", "Lactosa"]
  medicalNotes: string | null; // null → no se muestra el bloque
  birthDateLabel: string; // "12 mar 1947"
  roomName: string; // "Roble"
  isArchived: boolean;
  canLinkRelative: boolean; // admin y adulto mayor activo
  enrolledAtLabel: string; // "feb 2025"
  relatives: LinkedRelative[];
  pendingInvitationEmails: string[]; // invitaciones pending de este adulto mayor
};

export type RoomOption = { id: string; name: string };

// Valores del formulario tal como llegan del FormData
export type NewElderlyInput = {
  firstName: string;
  lastName: string;
  birthDate: string; // "1947-03-12" o "" si está vacío o incompleto
  enrolledAt: string; // ídem
  roomId: string;
  allergies: string; // texto libre
  medicalNotes: string;
};

export type NewElderlyField = keyof NewElderlyInput;
export type NewElderlyErrors = Partial<Record<NewElderlyField, string>>;

export type CreateElderlyResult =
  | { status: "success"; fullName: string }
  | { status: "invalid"; errors: NewElderlyErrors }
  | { status: "error" };

// Valores del formulario de invitación tal como llegan del FormData
export type RelativeInvitationInput = {
  firstName: string;
  lastName: string;
  email: string;
  relationship: string; // valor crudo del FormData
};

export type RelativeInvitationField = keyof RelativeInvitationInput;
export type RelativeInvitationErrors = Partial<
  Record<RelativeInvitationField, string>
>;
