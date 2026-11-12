type PhotoConsentIndicatorProps = {
  allowed: boolean;
};

// Solo lectura: el familiar no puede pasar el consentimiento de "no" a "sí"
export function PhotoConsentIndicator({ allowed }: PhotoConsentIndicatorProps) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`relative h-6 w-[42px] flex-none rounded-full ${allowed ? "bg-consent-check" : "bg-toggle-off"}`}
      >
        <span
          className={`absolute top-[3px] size-[18px] rounded-full bg-white ${allowed ? "right-[3px]" : "left-[3px]"}`}
        />
      </span>
      <span className="sr-only">
        {allowed ? "Fotos permitidas" : "Fotos no permitidas"}
      </span>
    </>
  );
}
