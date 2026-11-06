import type {
  Elderly,
  GuardianElderly,
  Invitation,
  RelationshipType,
  User,
} from "@/shared/database/types";
import { mockSession } from "@/shared/session/mock-session";
import type { ElderlySource } from "./types";

const DAYCARE_ID = mockSession.daycare.id;
const CREATED_AT = "2025-06-01T00:00:00Z";
const ROOM_ROBLE_ID = "room-roble";
const ROOM_CEDRO_ID = "room-cedro";

function elderly(
  id: string,
  firstName: string,
  lastName: string,
  fields: Pick<Elderly, "room_id" | "birth_date" | "enrolled_at"> &
    Partial<Pick<Elderly, "medical_notes" | "allergy_tags">>,
): Elderly {
  return {
    id,
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    medical_notes: null,
    allergy_tags: [],
    photo_consent: true,
    status: "active",
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    ...fields,
  };
}

function relative(id: string, firstName: string, lastName: string): User {
  return {
    id,
    daycare_id: DAYCARE_ID,
    role: "relative",
    status: "active",
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    avatar_url: null,
    notify_on_post: true,
    daily_summary_enabled: true,
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  };
}

function link(
  relativeId: string,
  elderlyId: string,
  relationship: RelationshipType,
): GuardianElderly {
  return {
    id: `link-${relativeId}-${elderlyId}`,
    relative_id: relativeId,
    elderly_id: elderlyId,
    relationship,
    created_at: CREATED_AT,
  };
}

export const mockElderly: ElderlySource = {
  referenceDate: "2025-06-17",
  rooms: [
    {
      id: ROOM_ROBLE_ID,
      daycare_id: DAYCARE_ID,
      is_default: false,
      name: "Roble",
      created_at: CREATED_AT,
    },
    {
      id: ROOM_CEDRO_ID,
      daycare_id: DAYCARE_ID,
      is_default: false,
      name: "Cedro",
      created_at: CREATED_AT,
    },
  ],
  elderly: [
    elderly("elderly-luis", "Luis", "Fernández", {
      room_id: ROOM_ROBLE_ID,
      birth_date: "1947-03-12",
      enrolled_at: "2025-02-10",
      allergy_tags: ["peanut"],
      medical_notes:
        "Alergia al maní. Evitar frutos secos. Hipertensión: toma su pastilla a las 12:00.",
    }),
    elderly("elderly-carmen", "Carmen", "Ruiz", {
      room_id: ROOM_ROBLE_ID,
      birth_date: "1950-01-20",
      enrolled_at: "2024-09-02",
    }),
    elderly("elderly-jorge", "Jorge", "Salazar", {
      room_id: ROOM_CEDRO_ID,
      birth_date: "1943-05-08",
      enrolled_at: "2024-11-18",
    }),
    elderly("elderly-rosa", "Rosa", "Méndez", {
      room_id: ROOM_CEDRO_ID,
      birth_date: "1945-02-14",
      enrolled_at: "2025-03-24",
    }),
    elderly("elderly-alberto", "Alberto", "Díaz", {
      room_id: ROOM_ROBLE_ID,
      birth_date: "1939-04-03",
      enrolled_at: "2024-07-15",
      allergy_tags: ["lactose"],
      medical_notes:
        "Intolerancia a la lactosa. Usar leche sin lactosa en el desayuno.",
    }),
    elderly("elderly-elena", "Elena", "Castro", {
      room_id: ROOM_CEDRO_ID,
      birth_date: "1948-06-01",
      enrolled_at: "2025-01-13",
    }),
    elderly("elderly-manuel", "Manuel", "Romero", {
      room_id: ROOM_ROBLE_ID,
      birth_date: "1953-01-09",
      enrolled_at: "2025-04-07",
    }),
    elderly("elderly-olga", "Olga", "Vega", {
      room_id: ROOM_CEDRO_ID,
      birth_date: "1941-03-25",
      enrolled_at: "2024-10-21",
    }),
  ],
  relatives: [
    relative("user-lucia", "Lucía", "Fernández"),
    relative("user-pablo", "Pablo", "Ruiz"),
    relative("user-marta", "Marta", "Salazar"),
    relative("user-andres", "Andrés", "Salazar"),
    relative("user-sofia", "Sofía", "Díaz"),
    relative("user-ricardo", "Ricardo", "Castro"),
    relative("user-ana", "Ana", "Romero"),
    relative("user-julia", "Julia", "Vega"),
  ],
  guardianElderly: [
    link("user-lucia", "elderly-luis", "daughter"),
    link("user-pablo", "elderly-carmen", "son"),
    link("user-marta", "elderly-jorge", "daughter"),
    link("user-andres", "elderly-jorge", "son"),
    link("user-sofia", "elderly-alberto", "daughter"),
    link("user-ricardo", "elderly-elena", "son"),
    link("user-ana", "elderly-manuel", "daughter"),
    link("user-julia", "elderly-olga", "daughter"),
  ],
  invitations: [
    {
      id: "invitation-diego",
      elderly_id: "elderly-luis",
      invited_by: "user-admin",
      first_name: "Diego",
      last_name: "Fernández",
      full_name: "Diego Fernández",
      email: "diego.fernandez@example.com",
      relationship: "son",
      code: "7K4P9",
      status: "pending",
      expires_at: "2025-06-24T00:00:00Z",
      accepted_at: null,
      created_at: CREATED_AT,
    } satisfies Invitation,
    // Inválidas: sirven para probar /activate-account sin afectar el listado
    {
      id: "invitation-expired",
      elderly_id: "elderly-rosa",
      invited_by: "user-admin",
      first_name: "Pablo",
      last_name: "Méndez",
      full_name: "Pablo Méndez",
      email: "pablo.mendez@example.com",
      relationship: "son",
      code: "EXP01",
      status: "expired",
      expires_at: "2025-06-10T00:00:00Z",
      accepted_at: null,
      created_at: CREATED_AT,
    } satisfies Invitation,
    {
      id: "invitation-cancelled",
      elderly_id: "elderly-rosa",
      invited_by: "user-admin",
      first_name: "Marta",
      last_name: "Méndez",
      full_name: "Marta Méndez",
      email: "marta.mendez@example.com",
      relationship: "daughter",
      code: "CAN01",
      status: "cancelled",
      expires_at: "2025-06-24T00:00:00Z",
      accepted_at: null,
      created_at: CREATED_AT,
    } satisfies Invitation,
  ],
  avatarTones: {
    "elderly-luis": "blue",
    "elderly-carmen": "pink",
    "elderly-jorge": "green",
    "elderly-rosa": "yellow",
    "elderly-alberto": "purple",
    "elderly-elena": "pink",
    "elderly-manuel": "blue",
    "elderly-olga": "green",
    "user-lucia": "lilac",
    "invitation-diego": "sky",
  },
};
