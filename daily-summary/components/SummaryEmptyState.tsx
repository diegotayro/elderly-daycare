type SummaryEmptyStateProps = {
  title: string;
  description?: string;
};

export function SummaryEmptyState({
  title,
  description,
}: SummaryEmptyStateProps) {
  return (
    <div className="rounded-[22px] border border-line bg-surface px-6 py-10 text-center">
      <h2 className="m-0 font-display text-xl leading-[normal] font-semibold text-ink">
        {title}
      </h2>
      {description && (
        <p className="mt-2 mb-0 text-[15px] text-muted-strong">{description}</p>
      )}
    </div>
  );
}
