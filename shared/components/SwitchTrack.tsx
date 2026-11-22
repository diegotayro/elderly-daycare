type SwitchTrackProps = {
  enabled: boolean;
};

// Solo el dibujo: quien lo usa aporta el botón con role="switch"
export function SwitchTrack({ enabled }: SwitchTrackProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative h-6 w-[42px] flex-none rounded-full transition-colors duration-200 motion-reduce:transition-none ${enabled ? "bg-consent-check" : "bg-toggle-off"}`}
    >
      <span
        className={`absolute top-[3px] left-[3px] size-[18px] rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none ${enabled ? "translate-x-[18px]" : "translate-x-0"}`}
      />
    </span>
  );
}
