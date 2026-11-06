import { mockInvitationCode } from "../mock-invitation-code";

export function InvitationCodePreview() {
  const { code, expiresInDays } = mockInvitationCode;

  return (
    <div className="rounded-2xl border-[1.5px] border-dashed border-code-line bg-consent-bg p-[18px] text-center">
      <div className="mb-2 text-xs font-extrabold tracking-[0.7px] text-code-ink">
        CÓDIGO DE INVITACIÓN
      </div>
      <div className="font-display text-[34px] leading-[normal] font-semibold tracking-[7px] text-consent-ink">
        {code}
      </div>
      <div className="mt-1.5 text-[13px] text-code-ink">
        Vence en {expiresInDays} días
      </div>
    </div>
  );
}
