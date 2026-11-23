import { requireAdminUser } from "@/auth/require-user";
import { UrlNoticeToast } from "@/shared/components/toast/UrlNoticeToast";
import { getStaffSource } from "../get-staff-source";
import { readStaffListNotice } from "../read-staff-list-notice";
import { staffListNoticeMessages } from "../staff-status-messages";
import { StaffListView } from "./StaffListView";

type StaffListContentProps = Pick<PageProps<"/staff">, "searchParams">;

export async function StaffListContent({
  searchParams,
}: StaffListContentProps) {
  await requireAdminUser();
  const notice = readStaffListNotice((await searchParams).notice);

  return (
    <>
      <StaffListView source={await getStaffSource()} />
      <UrlNoticeToast
        message={notice && staffListNoticeMessages[notice]}
        clearHref="/staff"
      />
    </>
  );
}
