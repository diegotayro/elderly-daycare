import { relationshipLabels } from "@/elderly/relationship-labels";
import type { FamilyMock } from "./types";

const LUIS_ID = "mock-luis";
const CARMEN_ID = "mock-carmen";
const DATE_LABEL = "martes 17 de junio";

export const mockFamily: FamilyMock = {
  relationshipLabel: relationshipLabels.daughter.label,
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
