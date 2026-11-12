import { relationshipLabels } from "@/elderly/relationship-labels";
import type { FamilyMock } from "./types";

const LUIS_ID = "mock-luis";
const CARMEN_ID = "mock-carmen";
const DATE_LABEL = "martes 17 de junio";

export const mockFamily: FamilyMock = {
  relationshipLabel: relationshipLabels.daughter.label,
  todayLabel: "MARTES 17 JUN",
  elderly: [
    {
      id: LUIS_ID,
      firstName: "Luis",
      fullName: "Luis Fernández",
      displayName: "Don Luis",
      initial: "L",
      tone: "blue",
      ageLabel: "78 años",
      roomName: "Roble",
      photoConsent: true,
    },
    {
      id: CARMEN_ID,
      firstName: "Carmen",
      fullName: "Carmen Ruiz",
      displayName: "Doña Carmen",
      initial: "C",
      tone: "pink",
      ageLabel: "75 años",
      roomName: "Cedro",
      photoConsent: true,
    },
  ],
  posts: [
    {
      id: "mock-post-1",
      type: "achievement",
      elderlyIds: [LUIS_ID],
      heading: "Don Luis",
      time: "14:20",
      authorLabel: "Cuidador/a Caro",
      body: "¡Hoy caminó por el jardín sin su andador! Estaba feliz de contárselo a todos. Un gran paso.",
      photoCaption: null,
      reactionCount: 3,
      commentCount: 1,
    },
    {
      id: "mock-post-2",
      type: "nap",
      elderlyIds: [CARMEN_ID],
      heading: "Doña Carmen",
      time: "13:10",
      authorLabel: "Cuidador/a Caro",
      body: "Durmió una siesta tranquila de una hora después del almuerzo.",
      photoCaption: null,
      reactionCount: 2,
      commentCount: 0,
    },
    {
      id: "mock-post-3",
      type: "activity",
      elderlyIds: [LUIS_ID],
      heading: "Don Luis",
      time: "09:40",
      authorLabel: "Cuidador/a Caro",
      body: "Taller de pintura esta mañana. Don Luis eligió el azul para todo y se concentró un montón mezclando colores.",
      photoCaption: "Foto · taller de pintura",
      reactionCount: 5,
      commentCount: 2,
    },
    {
      id: "mock-post-4",
      type: "announcement",
      elderlyIds: [],
      heading: "Anuncio general",
      time: "07:50",
      authorLabel: "Cuidador/a Caro",
      body: "El viernes salimos a pasear al parque por la mañana. Recuerden enviar sombrero, bloqueador y su medicación del mediodía.",
      photoCaption: null,
      reactionCount: 8,
      commentCount: 0,
    },
  ],
  summaries: [
    {
      elderlyId: LUIS_ID,
      dateLabel: DATE_LABEL,
      mealsCount: 3,
      sleepMinutes: 90,
      momentsCount: 4,
      mood: "Contento y participativo",
      highlights: [
        {
          id: "mock-highlight-1",
          type: "achievement",
          title: "¡Caminó sin su andador!",
          time: "14:20",
          detail: "Un gran paso, estaba feliz de contarlo.",
        },
        {
          id: "mock-highlight-2",
          type: "activity",
          title: "Taller de pintura",
          time: "09:40",
          detail: "Eligió el azul para todo.",
        },
      ],
    },
    {
      elderlyId: CARMEN_ID,
      dateLabel: DATE_LABEL,
      mealsCount: 2,
      sleepMinutes: 60,
      momentsCount: 2,
      mood: "Tranquila y conversadora",
      highlights: [
        {
          id: "mock-highlight-3",
          type: "nap",
          title: "Siesta tranquila",
          time: "13:10",
          detail: "Durmió una hora después del almuerzo.",
        },
      ],
    },
  ],
};
