import type { UserStatus } from "@/shared/database/types";
import type { FamilyAccountElderly } from "@/family/types";

export type RelativeProfile = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  photoUrl: string | null; // url firmada
  elderly: FamilyAccountElderly[];
};
