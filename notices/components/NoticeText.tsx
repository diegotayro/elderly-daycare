import type { Notice } from "../types";

type NoticeTextProps = {
  notice: Notice;
};

export function NoticeText({ notice }: NoticeTextProps) {
  switch (notice.kind) {
    case "comment":
      return (
        <>
          <b>{notice.actorName}</b> comentó en la publicación de {notice.elderlyDisplayName}.
        </>
      );
    case "reaction":
      return (
        <>
          <b>{notice.actorName}</b> reaccionó a la publicación de {notice.elderlyDisplayName}.
        </>
      );
    case "account_activated":
      return (
        <>
          <b>{notice.actorName}</b> activó su cuenta y ya sigue a {notice.elderlyDisplayName}.
        </>
      );
    case "reminder":
      return (
        <>
          Recuerda enviar el <b>resumen del día</b> de tus adultos mayores.
        </>
      );
  }
}
