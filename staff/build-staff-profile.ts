import { formatAge, formatEnrolledAt } from "@/elderly/elderly-formatters";
import type { Elderly } from "@/shared/database/types";
import { getUncoveredElderly } from "./get-uncovered-elderly";
import { getLinkedElderlyRows } from "./get-linked-elderly";
import { sortLinkedElderly } from "./sort-linked-elderly";
import { formatStaffStatus } from "./staff-formatters";
import type {
  ElderlyOption,
  LinkedElderly,
  StaffProfile,
  StaffProfileSource,
} from "./types";

function findRoomName(source: StaffProfileSource, elderly: Elderly): string {
  return source.rooms.find((room) => room.id === elderly.room_id)?.name ?? "";
}

function formatElderlyDetail(
  source: StaffProfileSource,
  elderly: Elderly,
): string {
  return `${formatAge(elderly.birth_date, source.referenceDate)} · Habitación ${findRoomName(source, elderly)}`;
}

function toLinkedElderly(
  source: StaffProfileSource,
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
    detail: formatElderlyDetail(source, elderly),
    roomName: findRoomName(source, elderly),
    status: elderly.status,
    statusLabel: isActive ? "ACTIVO" : "ARCHIVADO",
  };
}

function toOption(source: StaffProfileSource, elderly: Elderly): ElderlyOption {
  return {
    id: elderly.id,
    fullName: elderly.full_name,
    initial: elderly.first_name[0],
    tone: source.avatarTones[elderly.id] ?? "blue",
    roomName: findRoomName(source, elderly),
    detail: formatElderlyDetail(source, elderly),
  };
}

export function buildStaffProfile(
  source: StaffProfileSource,
  id: string,
): StaffProfile | null {
  const staff = source.staff.find((item) => item.id === id);
  if (!staff) return null;

  const rows = getLinkedElderlyRows(source, staff.id);
  const linkedIds = new Set(rows.map(({ elderly }) => elderly.id));
  const linkedElderly = sortLinkedElderly(
    rows.map(({ linkId, elderly }) => toLinkedElderly(source, linkId, elderly)),
  );
  const isArchivable = staff.status === "active" || staff.status === "archived";

  return {
    id: staff.id,
    fullName: staff.full_name,
    initial: staff.first_name[0],
    tone: source.avatarTones[staff.id] ?? "blue",
    email: staff.email,
    statusLabel: formatStaffStatus(staff.status),
    joinedAtLabel: formatEnrolledAt(staff.created_at),
    canManageLinks: staff.status === "active",
    canResendInvitation: staff.status === "pending",
    canArchive: staff.status === "active",
    canReactivate: staff.status === "archived",
    canCancelInvitation: staff.status === "pending",
    canDelete: isArchivable && !source.hasHistory,
    uncoveredElderly: getUncoveredElderly(
      linkedElderly,
      source.otherActiveLinks,
    ),
    linkedElderly,
    availableElderly: source.elderly
      .filter(
        (elderly) => elderly.status === "active" && !linkedIds.has(elderly.id),
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name, "es"))
      .map((elderly) => toOption(source, elderly)),
  };
}
