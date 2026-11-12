import { SmileIcon } from "@/shared/components/icons/SmileIcon";

type MoodCardProps = {
  mood: string;
};

export function MoodCard({ mood }: MoodCardProps) {
  return (
    <div className="mb-6 flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-[18px] py-4">
      <div className="flex size-11 flex-none items-center justify-center rounded-full bg-mood-bg text-mood-ink">
        <SmileIcon size={24} />
      </div>
      <div>
        <div className="text-[13px] text-muted">Ánimo del día</div>
        <div className="font-display text-lg font-semibold text-ink">
          {mood}
        </div>
      </div>
    </div>
  );
}
