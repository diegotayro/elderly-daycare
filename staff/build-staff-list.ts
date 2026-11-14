import { formatLinkedElderlyCount } from "./staff-formatters";
import { getLinkedElderlyRows } from "./get-linked-elderly";
import type {
  StaffIndicator,
  StaffList,
  StaffListItem,
  StaffMember,
  StaffSource,
} from "./types";

function resolveIndicator(
  staff: StaffMember,
  activeLinksCount: number,
): StaffIndicator {
  if (staff.status === "archived") return { kind: "archived" };
  if (activeLinksCount === 0) return { kind: "link" };
  return { kind: "none" };
}

function buildItem(source: StaffSource, staff: StaffMember): StaffListItem {
  const activeLinksCount = getLinkedElderlyRows(source, staff.id).filter(
    ({ elderly }) => elderly.status === "active",
  ).length;

  return {
    id: staff.id,
    fullName: staff.full_name,
    initial: staff.first_name[0],
    tone: source.avatarTones[staff.id] ?? "blue",
    summary: formatLinkedElderlyCount(activeLinksCount),
    indicator: resolveIndicator(staff, activeLinksCount),
  };
}

export function buildStaffList(source: StaffSource): StaffList {
  const itemsWithStatus = (status: StaffMember["status"]) =>
    source.staff
      .filter((staff) => staff.status === status)
      .map((staff) => buildItem(source, staff));

  return {
    active: itemsWithStatus("active"),
    pending: itemsWithStatus("pending"),
    archived: itemsWithStatus("archived"),
  };
}
