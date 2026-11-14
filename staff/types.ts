import type {
  Elderly,
  Room,
  StaffElderly,
  User,
} from "@/shared/database/types";
import type { AvatarTone } from "@/elderly/avatar-tones";
import type { ElderlyIndicator } from "@/elderly/types";

export type StaffMember = User & { email: string }; // role = staff; el email viene de auth.users

// Lo que devolvería la consulta: filas del esquema + datos de UI.
export type StaffSource = {
  referenceDate: string; // "2025-06-17": fija en el mock, para calcular edades
  staff: StaffMember[];
  elderly: Elderly[];
  rooms: Room[];
  staffElderly: StaffElderly[];
  avatarTones: Record<string, AvatarTone>; // por id de staff o elderly; solo UI
};

export type StaffIndicator = Extract<
  ElderlyIndicator,
  { kind: "link" } | { kind: "none" } | { kind: "archived" }
>;

export type StaffListItem = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  summary: string; // "3 adultos mayores vinculados"
  indicator: StaffIndicator;
  isLink: boolean; // false en las tarjetas agregadas desde el modal
};

export type StaffList = {
  active: StaffListItem[];
  pending: StaffListItem[];
  archived: StaffListItem[];
};

export type LinkedElderly = {
  linkId: string; // id de staff_elderly
  elderlyId: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  detail: string; // "78 años · Habitación Roble"
  roomName: string; // "Roble"
  status: "active" | "archived";
  statusLabel: "ACTIVO" | "ARCHIVADO";
};

export type ElderlyOption = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  roomName: string;
  detail: string; // "78 años · Habitación Roble", para la fila al vincular
};

export type StaffProfile = {
  id: string;
  fullName: string;
  initial: string;
  tone: AvatarTone;
  email: string;
  statusLabel: "Activo" | "Pendiente" | "Archivado";
  joinedAtLabel: string; // "feb 2025"
  canManageLinks: boolean; // status active o pending
  linkedElderly: LinkedElderly[];
  availableElderly: ElderlyOption[]; // activos y no vinculados
};

// Formulario "Agregar staff"
export type NewStaffInput = {
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmation: string;
};
export type NewStaffField = keyof NewStaffInput;
export type NewStaffErrors = Partial<Record<NewStaffField, string>>;
