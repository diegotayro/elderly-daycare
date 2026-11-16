import { requireAdminUser } from "@/auth/require-user";
import { getStaffSource } from "../get-staff-source";
import { readStaffListNotice } from "../read-staff-list-notice";
import { StaffListNoticeToast } from "./StaffListNoticeToast";
import { StaffListView } from "./StaffListView";

type StaffListContentProps = Pick<PageProps<"/staff">, "searchParams">;

export async function StaffListContent({
  searchParams,
}: StaffListContentProps) {
  await requireAdminUser();
  const { notice } = await searchParams;

  return (
    <>
      <StaffListView source={await getStaffSource()} />
      <StaffListNoticeToast notice={readStaffListNotice(notice)} />
    </>
  );
}
