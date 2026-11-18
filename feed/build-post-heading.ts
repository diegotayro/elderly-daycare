import type { FeedPostData } from "./types";

// "Luis, Jorge": solo los etiquetados que el usuario puede leer por RLS; "" si ninguno.
// Sin tratamiento (Don/Doña): el esquema no tiene dónde guardarlo.
export function joinElderlyNames(elderly: FeedPostData["elderly"]): string {
  return elderly.map(({ firstName }) => firstName).join(", ");
}

type HeadingSource = Pick<
  FeedPostData,
  "audience" | "title" | "roomName" | "elderly"
>;

export function buildPostHeading(post: HeadingSource): string {
  switch (post.audience) {
    case "elderly":
      // Si ninguno es legible, se usa un texto genérico en vez de dejar el encabezado vacío
      return joinElderlyNames(post.elderly) || "Adulto mayor";
    case "room":
      return post.title ?? `Habitación ${post.roomName ?? ""}`.trim();
    case "daycare":
      return post.title ?? "Toda la guardería";
  }
}
