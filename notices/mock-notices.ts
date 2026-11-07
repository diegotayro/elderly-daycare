import type { Notice } from "./types";

export const mockNotices: Notice[] = [
  {
    id: "notice-1",
    kind: "comment",
    actorName: "Lucía Fernández",
    elderlyDisplayName: "Don Luis",
    href: "/",
    timeLabel: "Hace 12 min",
  },
  {
    id: "notice-2",
    kind: "account_activated",
    actorName: "Diego Fernández",
    elderlyDisplayName: "Don Luis",
    timeLabel: "Hace 1 h",
  },
  {
    id: "notice-3",
    kind: "reaction",
    actorName: "Carla Méndez",
    elderlyDisplayName: "Doña Rosa",
    href: "/",
    timeLabel: "Hace 2 h",
  },
  {
    id: "notice-4",
    kind: "reminder",
    timeLabel: "Hoy 17:00",
  },
];
