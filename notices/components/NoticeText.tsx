import { buildPostPhrase } from "../build-post-phrase";
import type { Notice } from "../types";

type NoticeTextProps = {
  notice: Notice;
};

const UNKNOWN_REACTOR_NAME = "Un familiar";

export function NoticeText({ notice }: NoticeTextProps) {
  switch (notice.kind) {
    case "comment":
      return (
        <>
          <b>{notice.actorName}</b> comentó en la publicación {buildPostPhrase(notice.post)}.
        </>
      );
    case "reaction": {
      const actorName = notice.actorName ?? UNKNOWN_REACTOR_NAME;
      const postPhrase = buildPostPhrase(notice.post);

      if (notice.othersCount === 0) {
        return (
          <>
            <b>{actorName}</b> reaccionó a la publicación {postPhrase}.
          </>
        );
      }

      return (
        <>
          <b>{actorName}</b> y {notice.othersCount} más reaccionaron a la publicación {postPhrase}.
        </>
      );
    }
    case "account_activated":
      return notice.isFirstLink ? (
        <>
          <b>{notice.actorName}</b> activó su cuenta y ya sigue a {notice.elderlyFirstName}.
        </>
      ) : (
        <>
          <b>{notice.actorName}</b> ahora también sigue a {notice.elderlyFirstName}.
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
