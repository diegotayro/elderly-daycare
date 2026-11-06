import { CheckIcon } from "@/shared/components/icons/CheckIcon";

export function PhotoConsentCheckbox() {
  return (
    <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-consent-bg px-4 py-3.5">
      <input
        type="checkbox"
        name="photoConsent"
        defaultChecked
        className="peer sr-only"
      />
      <span className="mt-px flex size-6 flex-none items-center justify-center rounded-lg border-[1.5px] border-field-line bg-white text-white peer-checked:border-consent-check peer-checked:bg-consent-check peer-focus-visible:ring-2 peer-focus-visible:ring-field-focus *:opacity-0 peer-checked:*:opacity-100">
        <CheckIcon size={15} />
      </span>
      <span className="text-sm leading-[1.45] text-consent-ink">
        Autorizo a la guardería a tomar y compartir fotos de mi familiar dentro
        de la app.
      </span>
    </label>
  );
}
