export type DetailItem = { label: string; value: string };

type DetailsListProps = {
  details: DetailItem[];
};

export function DetailsList({ details }: DetailsListProps) {
  return (
    <dl className="m-0 overflow-hidden rounded-2xl border border-line bg-surface">
      {details.map(({ label, value }) => (
        <div
          key={label}
          className="flex justify-between gap-4 border-b border-line-soft px-[18px] py-[15px] last:border-b-0"
        >
          <dt className="text-[14.5px] text-muted-strong">{label}</dt>
          <dd className="m-0 min-w-0 break-words text-[14.5px] font-extrabold text-ink">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
