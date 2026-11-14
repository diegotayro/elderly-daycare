import { buildStaffList } from "../build-staff-list";
import type { StaffSource } from "../types";
import { StaffListTitle } from "./StaffListTitle";
import { StaffSearchList } from "./StaffSearchList";

type StaffListViewProps = {
  source: StaffSource;
};

export function StaffListView({ source }: StaffListViewProps) {
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <header className="mb-[22px]">
        <StaffListTitle />
      </header>
      <StaffSearchList list={buildStaffList(source)} />
    </div>
  );
}
