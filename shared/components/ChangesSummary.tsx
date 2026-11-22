type ChangesSummaryProps = {
  fieldLabels: string[];
};

// La región vive siempre en el DOM: así el lector de pantalla anuncia la línea cuando aparece
export function ChangesSummary({ fieldLabels }: ChangesSummaryProps) {
  return (
    <div aria-live="polite">
      {fieldLabels.length > 0 && (
        <p className="m-0 text-[13.5px] font-bold text-coral-strong">
          Cambiará: {fieldLabels.join(", ")}
        </p>
      )}
    </div>
  );
}
