import type { PostType } from "@/shared/database/types";

type PostTypeStyle = { label: string; bg: string; fg: string };

export const postTypeStyles: Record<PostType, PostTypeStyle> = {
  achievement: { label: "Logro", bg: "#CFEBD8", fg: "#3E9B6C" },
  activity: { label: "Actividad", bg: "#C7E7F1", fg: "#2E89A6" },
  announcement: { label: "Anuncio", bg: "#CCD8F4", fg: "#4E72C8" },
  nap: { label: "Siesta", bg: "#E7DCF6", fg: "#7B5FC0" }, // de crear-publicacion.dc.html
  meal: { label: "Comida", bg: "#F3E9CC", fg: "#9A7B1E" }, // fondo provisional
};
