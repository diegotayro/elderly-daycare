type FeedHeaderProps = {
  daycareName: string;
  userFirstName: string;
  elderlyCount: number;
  todayLabel: string;
};

export function FeedHeader({
  daycareName,
  userFirstName,
  elderlyCount,
  todayLabel,
}: FeedHeaderProps) {
  return (
    <header className="mb-6">
      <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-strong">
        GUARDERÍA · {daycareName.toUpperCase()}
      </div>
      <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
        Buenas, {userFirstName}
      </h1>
      <p className="mt-[5px] text-[14.5px] text-muted-strong">
        {elderlyCount} adultos mayores · {todayLabel}
      </p>
    </header>
  );
}
