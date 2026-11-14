import Link from "next/link";
import { DetailsList } from "@/shared/components/DetailsList";
import { ChevronLeftIcon } from "@/shared/components/icons/ChevronLeftIcon";
import type { StaffProfile } from "../types";
import { LinkedElderlyCard } from "./LinkedElderlyCard";
import { StaffProfileHeader } from "./StaffProfileHeader";

type StaffProfileViewProps = {
  profile: StaffProfile;
};

export function StaffProfileView({ profile }: StaffProfileViewProps) {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <Link
        href="/staff"
        className="mb-5 flex items-center gap-[7px] text-sm leading-[normal] font-bold text-muted-strong"
      >
        <ChevronLeftIcon size={18} />
        Volver a Staff
      </Link>
      <div className="flex flex-col gap-[26px] lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-[18px] lg:min-w-[300px]">
          <StaffProfileHeader profile={profile} />
          <DetailsList
            details={[
              { label: "Email", value: profile.email },
              { label: "Estado", value: profile.statusLabel },
              { label: "En el equipo desde", value: profile.joinedAtLabel },
            ]}
          />
        </div>
        <div className="flex w-full flex-col gap-3.5 lg:w-[300px] lg:flex-none">
          <LinkedElderlyCard
            staffId={profile.id}
            staffFullName={profile.fullName}
            linkedElderly={profile.linkedElderly}
            availableElderly={profile.availableElderly}
            canManageLinks={profile.canManageLinks}
          />
        </div>
      </div>
    </div>
  );
}
