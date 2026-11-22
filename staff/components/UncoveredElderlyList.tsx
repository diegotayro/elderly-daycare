type UncoveredElderlyListProps = {
  fullNames: string[];
};

export function UncoveredElderlyList({ fullNames }: UncoveredElderlyListProps) {
  if (fullNames.length === 0) return null;

  return (
    <div className="mb-4 text-[15px] text-muted-strong">
      <p className="m-0 mb-1.5">
        Estos adultos mayores se quedarán sin cuidador/a:
      </p>
      <ul className="m-0 list-disc pl-5 font-bold text-ink">
        {fullNames.map((fullName) => (
          <li key={fullName}>{fullName}</li>
        ))}
      </ul>
    </div>
  );
}
