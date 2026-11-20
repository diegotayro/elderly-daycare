import { joinElderlyNames } from "@/feed/build-post-heading";
import type { NoticePost } from "./types";

// Frase que sigue a "la publicación": “Paseo al parque”, de Luis, Carmen, de la Habitación Girasol…
export function buildPostPhrase(post: NoticePost): string {
  const quotedTitle = post.title ? `“${post.title}”` : null;

  switch (post.audience) {
    case "elderly": {
      const names = joinElderlyNames(post.elderlyNames.map((firstName) => ({ firstName })));
      return names ? `de ${names}` : "de un adulto mayor";
    }
    case "room":
      return quotedTitle ?? (post.roomName ? `de la Habitación ${post.roomName}` : "de una habitación");
    case "daycare":
      return quotedTitle ?? "para toda la guardería";
  }
}
