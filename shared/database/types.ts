// Filas de las tablas del esquema (references/documents/database-schema.md).
// timestamptz y date se representan como string ISO.

export type UserRole = "staff" | "relative" | "admin";
export type UserStatus = "pending" | "active" | "archived";
export type ElderlyStatus = "active" | "archived";
export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "announcement";
export type PostAudience = "elderly" | "room" | "daycare";

export type Daycare = { id: string; name: string; created_at: string };

export type User = {
  id: string;
  daycare_id: string;
  role: UserRole;
  status: UserStatus;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  notify_on_post: boolean;
  daily_summary_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  daycare_id: string;
  is_default: boolean;
  name: string;
  created_at: string;
};

export type Elderly = {
  id: string;
  room_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[];
  photo_consent: boolean;
  status: ElderlyStatus;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  audience: PostAudience;
  room_id: string | null; // solo si audience = room
  type: PostType;
  title: string | null;
  body: string;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type PostElderly = { post_id: string; elderly_id: string };

export type PostPhoto = {
  id: string;
  post_id: string;
  url: string; // "{post_id}/taller-de-pintura.jpg"
  width: number | null;
  height: number | null;
  position: number;
  created_at: string;
};

export type RelationshipType = "son" | "daughter" | "guardian";
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export type GuardianElderly = {
  id: string;
  relative_id: string;
  elderly_id: string;
  relationship: RelationshipType;
  created_at: string;
};

export type Invitation = {
  id: string;
  elderly_id: string;
  invited_by: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  relationship: RelationshipType;
  code: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export type StaffElderly = {
  id: string;
  staff_id: string;
  elderly_id: string;
  created_at: string;
};
