export type NoticeKind = "comment" | "reaction" | "account_activated" | "reminder";

type NoticeBase = {
  id: string;
  timeLabel: string; // "Hace 12 min", fijo en el mock
};

export type Notice =
  | (NoticeBase & {
      kind: "comment" | "reaction";
      actorName: string; // "Lucía Fernández"
      elderlyDisplayName: string; // "Don Luis", texto fijo del mock
      href: string; // "/" hasta que exista el detalle
    })
  | (NoticeBase & {
      kind: "account_activated";
      actorName: string;
      elderlyDisplayName: string;
    })
  | (NoticeBase & { kind: "reminder" });
