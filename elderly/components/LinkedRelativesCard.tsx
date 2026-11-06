import type { LinkedRelative } from "../types";
import { LinkedRelativeRow } from "./LinkedRelativeRow";
import { LinkRelativeDialog } from "./LinkRelativeDialog";

type LinkedRelativesCardProps = {
  relatives: LinkedRelative[];
  elderlyFullName: string;
  elderlyFirstName: string;
  pendingInvitationEmails: string[];
};

export function LinkedRelativesCard({
  relatives,
  elderlyFullName,
  elderlyFirstName,
  pendingInvitationEmails,
}: LinkedRelativesCardProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface px-[18px] py-4">
      <h2 className="m-0 mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        FAMILIARES VINCULADOS
      </h2>
      <div className="flex flex-col gap-3.5">
        {relatives.map((relative) => (
          <LinkedRelativeRow key={relative.id} relative={relative} />
        ))}
        <LinkRelativeDialog
          elderlyFullName={elderlyFullName}
          elderlyFirstName={elderlyFirstName}
          pendingInvitationEmails={pendingInvitationEmails}
        />
      </div>
    </section>
  );
}
