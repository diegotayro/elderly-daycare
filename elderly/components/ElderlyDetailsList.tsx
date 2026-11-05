import type { ElderlyProfile } from "../types";

type ElderlyDetailsListProps = {
  profile: ElderlyProfile;
};

export function ElderlyDetailsList({ profile }: ElderlyDetailsListProps) {
  const details = [
    { label: "Fecha de nacimiento", value: profile.birthDateLabel },
    { label: "Habitación", value: profile.roomName },
    { label: "Ingreso", value: profile.enrolledAtLabel },
  ];

  return (
    <dl className="m-0 overflow-hidden rounded-2xl border border-line bg-surface">
      {details.map(({ label, value }) => (
        <div
          key={label}
          className="flex justify-between border-b border-line-soft px-[18px] py-[15px] last:border-b-0"
        >
          <dt className="text-[14.5px] text-muted-strong">{label}</dt>
          <dd className="m-0 text-[14.5px] font-extrabold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
