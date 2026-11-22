import type {
  Elderly,
  Room,
  StaffElderly,
  User,
} from "@/shared/database/types";
import type { AvatarTone } from "@/elderly/avatar-tones";
import type { ElderlyIndicator } from "@/elderly/types";
import type { AvatarPermissions } from "@/users/types";

export type StaffMember = User & { email: string }; // role = staff; el email viene de auth.users

// Filas del esquema leídas con la sesión del admin + datos de UI.
export type StaffSource = {
  referenceDate: string; // hoy en Lima ("2025-06-17"), para calcular edades
  staff: StaffMember[];
  elderly: Elderly[];
  rooms: Room[];
  staffElderly: StaffElderly[];
  avatarTones: Record<string, AvatarTone>; // por id de staff o elderly; solo UI
  avatarUrls: Record<string, string>; // avatar firmado, por id de staff
};

// Lo que solo necesita el perfil del staff (la lista no lo lee)
export type StaffProfileSource = StaffSource & {
  hasHistory: boolean; // staff_has_history(id)
  otherActiveLinks: StaffElderly[]; // vínculos de los mismos adultos mayores con otros staff active
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
  photoUrl: string | null;
  summary: string; // "3 adultos mayores vinculados"
  indicator: StaffIndicator;
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
  photoUrl: string | null;
  avatarPermissions: AvatarPermissions; // con un staff archived solo se puede quitar la foto
  email: string;
  statusLabel: "Activo" | "Pendiente" | "Archivado";
  joinedAtLabel: string; // "feb 2025"
  canManageLinks: boolean; // status = active
  canResendInvitation: boolean; // status = pending
  canArchive: boolean; // status = active
  canReactivate: boolean; // status = archived
  canCancelInvitation: boolean; // status = pending
  canDelete: boolean; // active o archived y sin historial
  uncoveredElderly: string[]; // nombres de los vinculados activos sin otro staff active
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

export type InviteStaffResult =
  | { status: "invalid"; errors: NewStaffErrors }
  | { status: "error" }
  | { status: "success"; email: string };

export type StaffActionResult = { status: "success" } | { status: "error" };

export type DeleteStaffResult = StaffActionResult | { status: "has-history" };

export type StaffListNotice = "invitation-cancelled" | "staff-deleted";
