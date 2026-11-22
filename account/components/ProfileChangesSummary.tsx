import { accountMessages, profileFieldLabels } from "../account-messages";
import type { ProfileField } from "../types";

type ProfileChangesSummaryProps = {
  changedFields: ProfileField[];
};

// La región vive siempre en el DOM: así el lector de pantalla anuncia la línea cuando aparece
export function ProfileChangesSummary({
  changedFields,
}: ProfileChangesSummaryProps) {
  return (
    <div aria-live="polite">
      {changedFields.length > 0 && (
        <p className="m-0 text-[13.5px] font-bold text-coral-strong">
          {accountMessages.changesSummary(
            changedFields.map((field) => profileFieldLabels[field]),
          )}
        </p>
      )}
    </div>
  );
}
