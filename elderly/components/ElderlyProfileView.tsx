import Link from "next/link";
import { ChevronLeftIcon } from "@/shared/components/icons/ChevronLeftIcon";
import { SunIcon } from "@/shared/components/icons/SunIcon";
import type { ElderlyProfile } from "../types";
import { ElderlyDetailsList } from "./ElderlyDetailsList";
import { ElderlyProfileHeader } from "./ElderlyProfileHeader";
import { LinkedRelativesCard } from "./LinkedRelativesCard";
import { MedicalNotesAlert } from "./MedicalNotesAlert";

type ElderlyProfileViewProps = {
  profile: ElderlyProfile;
};

export function ElderlyProfileView({ profile }: ElderlyProfileViewProps) {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <Link
        href="/elderly"
        className="mb-5 flex items-center gap-[7px] text-sm leading-[normal] font-bold text-muted-strong"
      >
        <ChevronLeftIcon size={18} />
        Volver a Adultos mayores
      </Link>
      <div className="flex flex-col gap-[26px] lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-[18px] lg:min-w-[300px]">
          <ElderlyProfileHeader profile={profile} />
          {profile.medicalNotes && (
            <MedicalNotesAlert notes={profile.medicalNotes} />
          )}
          <ElderlyDetailsList profile={profile} />
        </div>
        <div className="flex w-full flex-col gap-3.5 lg:w-[300px] lg:flex-none">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink p-[13px] text-[15px] font-extrabold text-white"
          >
            <SunIcon size={18} strokeWidth={2} />
            Resumen del día
          </Link>
          <LinkedRelativesCard
            relatives={profile.relatives}
            elderlyFullName={profile.fullName}
            elderlyFirstName={profile.firstName}
            pendingInvitationEmails={profile.pendingInvitationEmails}
          />
        </div>
      </div>
    </div>
  );
}
