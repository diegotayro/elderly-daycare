import { requireAdminUser } from "@/auth/require-user";
import { getStaffSource } from "../get-staff-source";
import { StaffListView } from "./StaffListView";

export async function StaffListContent() {
  await requireAdminUser();

  return <StaffListView source={await getStaffSource()} />;
}
