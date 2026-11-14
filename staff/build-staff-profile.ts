import { formatAge, formatEnrolledAt } from "@/elderly/elderly-formatters";
import type { Elderly } from "@/shared/database/types";
import { getLinkedElderlyRows } from "./get-linked-elderly";
import { formatStaffStatus } from "./staff-formatters";
import type {
  ElderlyOption,
  LinkedElderly,
  StaffProfile,
  StaffSource,
} from "./types";

function findRoomName(source: StaffSource, elderly: Elderly): string {
  return source.rooms.find((room) => room.id === elderly.room_id)?.name ?? "";
}

function toLinkedElderly(
  source: StaffSource,
  linkId: string,
  elderly: Elderly,
): LinkedElderly {
  const isActive = elderly.status === "active";
  return {
    linkId,
    elderlyId: elderly.id,
    fullName: elderly.full_name,
    initial: elderly.first_name[0],
    tone: source.avatarTones[elderly.id] ?? "blue",
    detail: `${formatAge(elderly.birth_date, source.referenceDate)} · Habitación ${findRoomName(source, elderly)}`,
    status: elderly.status,
    statusLabel: isActive ? "ACTIVO" : "ARCHIVADO",
  };
}

function toOption(source: StaffSource, elderly: Elderly): ElderlyOption {
  return {
    id: elderly.id,
    fullName: elderly.full_name,
    initial: elderly.first_name[0],
    tone: source.avatarTones[elderly.id] ?? "blue",
    roomName: findRoomName(source, elderly),
  };
}

export function buildStaffProfile(
  source: StaffSource,
  id: string,
): StaffProfile | null {
  const staff = source.staff.find((item) => item.id === id);
  if (!staff) return null;

  const rows = getLinkedElderlyRows(source, staff.id);
  const linkedIds = new Set(rows.map(({ elderly }) => elderly.id));
  const linked = rows.map(({ linkId, elderly }) =>
    toLinkedElderly(source, linkId, elderly),
  );

  return {
    id: staff.id,
    fullName: staff.full_name,
    initial: staff.first_name[0],
    tone: source.avatarTones[staff.id] ?? "blue",
    email: staff.email,
    statusLabel: formatStaffStatus(staff.status),
    joinedAtLabel: formatEnrolledAt(staff.created_at),
    canManageLinks: staff.status !== "archived",
    // Activos primero; Array.sort es estable y conserva el orden por fecha de vínculo
    linkedElderly: linked.sort(
      (a, b) =>
        Number(a.status === "archived") - Number(b.status === "archived"),
    ),
    availableElderly: source.elderly
      .filter(
        (elderly) => elderly.status === "active" && !linkedIds.has(elderly.id),
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name, "es"))
      .map((elderly) => toOption(source, elderly)),
  };
}
