import { AuthFormView } from "./AuthFormView";
import { CreatePasswordForm } from "./CreatePasswordForm";

type CreatePasswordViewProps = {
  firstName?: string;
  email?: string;
  disabled?: boolean; // fallback de Suspense: sin datos y con los campos deshabilitados
};

const INTRO = "Elige la contraseña con la que entrarás a Casa Nogal.";

export function CreatePasswordView({
  firstName,
  email = "",
  disabled,
}: CreatePasswordViewProps) {
  return (
    <AuthFormView
      title="Crea tu contraseña"
      description={firstName ? `Hola, ${firstName}. ${INTRO}` : INTRO}
    >
      <CreatePasswordForm email={email} disabled={disabled} />
    </AuthFormView>
  );
}
