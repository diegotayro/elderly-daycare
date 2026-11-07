import { Avatar } from "@/shared/components/Avatar";

type ProfileCardProps = {
  fullName: string;
  email: string;
  roleLabel: string;
};

export function ProfileCard({ fullName, email, roleLabel }: ProfileCardProps) {
  return (
    <section className="mb-[18px] flex items-center gap-[18px] rounded-[18px] border border-line bg-surface px-[22px] py-5">
      <Avatar initial={fullName[0]} size={64} fontSize={26} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-xl leading-[normal] font-semibold text-ink">
          {fullName}
        </div>
        <div className="text-sm leading-[normal] break-words text-muted-strong">
          {email}
        </div>
        <div className="mt-0.5 text-[13px] leading-[normal] text-muted">
          {roleLabel}
        </div>
      </div>
      <button
        type="button"
        className="cursor-pointer rounded-xl border-[1.5px] border-line bg-white px-4 py-[9px] text-sm font-bold text-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        Editar
      </button>
    </section>
  );
}
