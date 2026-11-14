import { sortLinkedElderly } from "./sort-linked-elderly";
import type { ElderlyOption, LinkedElderly } from "./types";

export function toLinkedElderly(option: ElderlyOption): LinkedElderly {
  return {
    linkId: `local-${option.id}`, // el mock no persiste; SPEC 21 usa el id real
    elderlyId: option.id,
    fullName: option.fullName,
    initial: option.initial,
    tone: option.tone,
    detail: option.detail,
    roomName: option.roomName,
    status: "active",
    statusLabel: "ACTIVO",
  };
}

export function toElderlyOption(linked: LinkedElderly): ElderlyOption {
  return {
    id: linked.elderlyId,
    fullName: linked.fullName,
    initial: linked.initial,
    tone: linked.tone,
    roomName: linked.roomName,
    detail: linked.detail,
  };
}

export function addLinks(
  current: LinkedElderly[],
  options: ElderlyOption[],
): LinkedElderly[] {
  return sortLinkedElderly([...current, ...options.map(toLinkedElderly)]);
}

export function sortOptionsByName(options: ElderlyOption[]): ElderlyOption[] {
  return [...options].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es"),
  );
}
