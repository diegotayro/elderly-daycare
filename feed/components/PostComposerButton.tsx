import { Avatar } from "@/shared/components/Avatar";
import { CameraIcon } from "@/shared/components/icons/CameraIcon";
import { NewPostTrigger } from "./NewPostTrigger";

type PostComposerButtonProps = {
  userInitial: string;
};

export function PostComposerButton({ userInitial }: PostComposerButtonProps) {
  return (
    <NewPostTrigger className="mb-6 flex w-full cursor-pointer items-center gap-3.5 rounded-[18px] border border-line bg-surface px-[18px] py-3.5 text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]">
      <Avatar initial={userInitial} size={40} />
      <span className="flex-1 text-[15px] text-muted">Comparte un momento…</span>
      <span className="flex size-[38px] items-center justify-center rounded-xl bg-coral-soft text-coral-icon">
        <CameraIcon size={19} />
      </span>
    </NewPostTrigger>
  );
}
