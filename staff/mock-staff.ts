import type { Elderly, StaffElderly } from "@/shared/database/types";
import { mockElderly } from "@/elderly/mock-elderly";
import { mockSession } from "@/shared/session/mock-session";
import type { StaffMember, StaffSource } from "./types";

const DAYCARE_ID = mockSession.daycare.id;
const CREATED_AT = "2025-06-01T00:00:00Z";

// Adulta mayor archivada propia del mock de staff; no toca mockElderly (lo usa el feed)
const archivedElderly: Elderly = {
  id: "elderly-teresa",
  room_id: "room-roble",
  first_name: "Teresa",
  last_name: "Paredes",
  full_name: "Teresa Paredes",
  birth_date: "1940-08-22",
  enrolled_at: "2024-05-06",
  medical_notes: null,
  allergy_tags: [],
  photo_consent: true,
  status: "archived",
  created_at: CREATED_AT,
  updated_at: CREATED_AT,
};

function staffMember(
  id: string,
  firstName: string,
  lastName: string,
  fields: Pick<StaffMember, "status" | "email" | "created_at">,
): StaffMember {
  return {
    id,
    daycare_id: DAYCARE_ID,
    role: "staff",
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    avatar_url: null,
    notify_on_post: true,
    daily_summary_enabled: false,
    updated_at: CREATED_AT,
    ...fields,
  };
}

function link(
  staffId: string,
  elderlyId: string,
  createdAt: string,
): StaffElderly {
  return {
    id: `link-${staffId}-${elderlyId}`,
    staff_id: staffId,
    elderly_id: elderlyId,
    created_at: createdAt,
  };
}

export const mockStaff: StaffSource = {
  referenceDate: mockElderly.referenceDate,
  rooms: mockElderly.rooms,
  elderly: [...mockElderly.elderly, archivedElderly],
  staff: [
    staffMember("staff-carolina", "Carolina", "Paz", {
      status: "active",
      email: "carolina.paz@casanogal.pe",
      created_at: "2024-03-11T00:00:00Z",
    }),
    staffMember("staff-miguel", "Miguel", "Torres", {
      status: "active",
      email: "miguel.torres@casanogal.pe",
      created_at: "2025-02-03T00:00:00Z",
    }),
    staffMember("staff-lucia", "Lucía", "Ramos", {
      status: "pending",
      email: "lucia.ramos@casanogal.pe",
      created_at: "2025-06-10T00:00:00Z",
    }),
    staffMember("staff-andres", "Andrés", "Silva", {
      status: "archived",
      email: "andres.silva@casanogal.pe",
      created_at: "2024-08-19T00:00:00Z",
    }),
  ],
  staffElderly: [
    link("staff-carolina", "elderly-luis", "2024-03-12T00:00:00Z"),
    link("staff-carolina", "elderly-carmen", "2024-09-03T00:00:00Z"),
    link("staff-carolina", "elderly-teresa", "2024-05-07T00:00:00Z"),
    link("staff-lucia", "elderly-rosa", "2025-06-11T00:00:00Z"),
    link("staff-lucia", "elderly-alberto", "2025-06-12T00:00:00Z"),
    link("staff-andres", "elderly-elena", "2025-01-14T00:00:00Z"),
    link("staff-andres", "elderly-manuel", "2025-04-08T00:00:00Z"),
  ],
  avatarTones: {
    ...mockElderly.avatarTones,
    "elderly-teresa": "purple",
    "staff-carolina": "pink",
    "staff-miguel": "blue",
    "staff-lucia": "green",
    "staff-andres": "yellow",
  },
};
