type SummaryHeroProps = {
  displayName: string;
  dateLabel: string;
};

export function SummaryHero({ displayName, dateLabel }: SummaryHeroProps) {
  return (
    <header className="mb-[22px] rounded-[22px] bg-linear-160 from-summary-hero-from to-summary-hero-to px-5 py-6 lg:px-[30px] lg:py-7">
      <div className="mb-1.5 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-strong">
        RESUMEN DEL DÍA
      </div>
      <h1 className="m-0 font-display text-[26px] leading-[normal] font-semibold text-ink lg:text-[32px]">
        El día de {displayName}
      </h1>
      <p className="mt-1.5 text-[15px] text-summary-hero-date">{dateLabel}</p>
    </header>
  );
}
