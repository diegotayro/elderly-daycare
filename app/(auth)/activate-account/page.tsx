import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivateAccountForm } from "@/auth/components/ActivateAccountForm";
import { ActivateAccountView } from "@/auth/components/ActivateAccountView";
import { findInvitationPreview } from "@/auth/find-invitation-preview";
import { mockElderly } from "@/elderly/mock-elderly";

export const metadata: Metadata = {
  title: "Activar cuenta · Casa Nogal",
};

// searchParams es dinámico: se lee dentro de Suspense para que el shell sea estático
async function ActivateAccountFromQuery({
  searchParams,
}: Pick<PageProps<"/activate-account">, "searchParams">) {
  const { code } = await searchParams;
  const invitation = findInvitationPreview(
    mockElderly,
    typeof code === "string" ? code : undefined,
  );
  return <ActivateAccountForm invitation={invitation} />;
}

export default function ActivateAccountPage(
  props: PageProps<"/activate-account">,
) {
  return (
    <ActivateAccountView>
      <Suspense fallback={<ActivateAccountForm invitation={null} />}>
        <ActivateAccountFromQuery searchParams={props.searchParams} />
      </Suspense>
    </ActivateAccountView>
  );
}
