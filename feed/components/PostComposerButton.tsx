import Link from "next/link";
import { Avatar } from "@/shared/components/Avatar";
import { CameraIcon } from "@/shared/components/icons/CameraIcon";

type PostComposerLinkProps = {
  userInitial: string;
};

export function PostComposerLink({ userInitial }: PostComposerLinkProps) {
  return (
    <Link
      href="/"
      className="mb-6 flex items-center gap-3.5 rounded-[18px] border border-line bg-surface px-[18px] py-3.5 shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
    >
      <Avatar initial={userInitial} size={40} />
      <span className="flex-1 text-[15px] text-muted">Comparte un momento…</span>
      <span className="flex size-[38px] items-center justify-center rounded-xl bg-coral-soft text-coral-icon">
        <CameraIcon size={19} />
      </span>
    </Link>
  );
}
