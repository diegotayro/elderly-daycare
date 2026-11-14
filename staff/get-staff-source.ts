import { mockStaff } from "./mock-staff";
import type { StaffSource } from "./types";

// Mock hasta SPEC 21, que lo reemplaza por la consulta a Supabase.
export async function getStaffSource(): Promise<StaffSource> {
  return mockStaff;
}
