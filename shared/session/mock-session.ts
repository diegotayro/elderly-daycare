import type { Daycare, User } from "@/shared/database/types";

const DAYCARE_ID = "daycare-1";
const CREATED_AT = "2025-06-01T00:00:00Z";

export const mockSession: {
  daycare: Daycare;
  currentUser: User;
} = {
  daycare: { id: DAYCARE_ID, name: "Casa Nogal", created_at: CREATED_AT },
  currentUser: {
    id: "user-caro",
    daycare_id: DAYCARE_ID,
    role: "staff",
    status: "active",
    first_name: "Caro",
    last_name: "Giménez",
    full_name: "Caro Giménez",
    avatar_url: null,
    notify_on_post: true,
    daily_summary_enabled: true,
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  },
};
