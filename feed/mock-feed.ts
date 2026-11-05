import { mockSession } from "@/shared/session/mock-session";
import type { FeedSource } from "./types";

const CARO_ID = mockSession.currentUser.id;
const ROOM_ID = "room-roble";
const LUIS_ID = "elderly-luis";
const CREATED_AT = "2025-06-01T00:00:00Z";

export const mockFeed: FeedSource = {
  ...mockSession,
  elderlyCount: 12,
  todayLabel: "martes 17 jun",
  rooms: [
    {
      id: ROOM_ID,
      daycare_id: mockSession.daycare.id,
      is_default: false,
      name: "Roble",
      created_at: CREATED_AT,
    },
  ],
  elderly: [
    {
      id: LUIS_ID,
      room_id: ROOM_ID,
      first_name: "Luis",
      last_name: "Ramírez",
      full_name: "Luis Ramírez",
      birth_date: "1944-03-12",
      enrolled_at: "2025-01-10",
      medical_notes: null,
      allergy_tags: [],
      photo_consent: true,
      status: "active",
      created_at: CREATED_AT,
      updated_at: CREATED_AT,
    },
  ],
  posts: [
    {
      id: "post-achievement",
      author_id: CARO_ID,
      audience: "elderly",
      room_id: null,
      type: "achievement",
      title: null,
      body: "¡Hoy caminó por el jardín sin su andador! Estaba feliz de contárselo a todos. Un gran paso.",
      published_at: "2025-06-17T14:20:00Z",
      created_at: "2025-06-17T14:20:00Z",
      updated_at: "2025-06-17T14:20:00Z",
    },
    {
      id: "post-activity",
      author_id: CARO_ID,
      audience: "elderly",
      room_id: null,
      type: "activity",
      title: null,
      body: "Taller de pintura esta mañana. Don Luis eligió el azul para todo y se concentró un montón mezclando colores.",
      published_at: "2025-06-17T09:40:00Z",
      created_at: "2025-06-17T09:40:00Z",
      updated_at: "2025-06-17T09:40:00Z",
    },
    {
      id: "post-announcement",
      author_id: CARO_ID,
      audience: "daycare",
      room_id: null,
      type: "announcement",
      title: "Anuncio general",
      body: "El viernes salimos a pasear al parque por la mañana. Recuerden enviar sombrero, bloqueador y su medicación del mediodía.",
      published_at: "2025-06-17T07:50:00Z",
      created_at: "2025-06-17T07:50:00Z",
      updated_at: "2025-06-17T07:50:00Z",
    },
  ],
  postElderly: [
    { post_id: "post-achievement", elderly_id: LUIS_ID },
    { post_id: "post-activity", elderly_id: LUIS_ID },
  ],
  postPhotos: [
    {
      id: "photo-1",
      post_id: "post-activity",
      url: "post-activity/taller-de-pintura.jpg",
      width: null,
      height: null,
      position: 1,
      created_at: "2025-06-17T09:40:00Z",
    },
  ],
  postCounts: {
    "post-achievement": { reactions: 3, comments: 1 },
    "post-activity": { reactions: 5, comments: 2 },
    "post-announcement": { reactions: 8, comments: 0 },
  },
};
