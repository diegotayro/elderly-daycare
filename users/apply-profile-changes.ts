import "server-only";
import { refresh } from "next/cache";
import { accountMessages } from "@/account/account-messages";
import { diffProfileChanges } from "@/account/diff-profile-changes";
import type {
  ActionResult,
  ProfileChanges,
  ProfileErrors,
} from "@/account/types";
import { validateProfileChanges } from "@/account/validate-profile";
import { createAdminClient } from "@/shared/supabase/admin";
import type { createClient } from "@/shared/supabase/server";

type SessionClient = ReturnType<typeof createClient>;

// `email` es undefined cuando el email no se puede cambiar (staff pending): se ignora
type CurrentProfile = {
  firstName: string;
  lastName: string;
  email?: string;
};

const error: ActionResult<ProfileErrors> = {
  status: "error",
  message: accountMessages.profileSaveError,
};

const USERS_PER_PAGE = 1000;

type AuthAdmin = ReturnType<typeof createAdminClient>["auth"]["admin"];

// Auth no siempre responde `email_exists` al repetir un email: puede devolver un 500
// (`unexpected_failure`, por la restricción única de auth.users). Por eso, cuando el cambio falla,
// se busca si otra cuenta ya usa ese email. Solo ocurre al fallar, no en cada guardado.
async function isEmailUsedByAnotherUser(
  auth: AuthAdmin,
  userId: string,
  email: string,
): Promise<boolean> {
  let page: number | null = 1;
  while (page !== null) {
    const { data, error: listError } = await auth.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });
    if (listError) return false;

    const isUsed = data.users.some(
      (user) => user.id !== userId && user.email?.toLowerCase() === email,
    );
    if (isUsed) return true;
    page = data.nextPage;
  }
  return false;
}

// Cambia el email al instante, sin correo de confirmación. Único uso de service_role de este flujo.
async function changeEmail(
  userId: string,
  email: string,
): Promise<ActionResult<ProfileErrors>> {
  const auth = createAdminClient().auth.admin;
  const { error: authError } = await auth.updateUserById(userId, {
    email,
    email_confirm: true,
  });
  if (!authError) return { status: "ok" };

  const isEmailInUse =
    authError.code === "email_exists" ||
    (await isEmailUsedByAnotherUser(auth, userId, email));
  if (isEmailInUse) {
    return { status: "invalid", errors: { email: accountMessages.emailInUse } };
  }
  console.error("applyProfileChanges: no se pudo cambiar el email", authError);
  return error;
}

async function changeNames(
  supabase: SessionClient,
  userId: string,
  { firstName, lastName }: ProfileChanges,
): Promise<ActionResult<ProfileErrors>> {
  if (firstName === undefined && lastName === undefined) return { status: "ok" };

  const { data, error: updateError } = await supabase
    .from("users")
    .update({
      ...(firstName !== undefined && { first_name: firstName }),
      ...(lastName !== undefined && { last_name: lastName }),
    })
    .eq("id", userId)
    .select("id");
  // RLS actualiza 0 filas sin error
  if (updateError || data.length === 0) {
    console.error("applyProfileChanges: no se pudieron guardar los nombres", updateError);
    return error;
  }
  return { status: "ok" };
}

// Quien llama ya verificó que puede editar a `userId` (admin, su guardería, rol y estado correctos).
// Compara con lo guardado (no confía en el cliente) y valida todo antes de escribir.
// Primero el email: si falla (p. ej. repetido) no se guarda nada. Si fallan los nombres después,
// el email ya cambió: se informa el error y el admin vuelve a guardar.
export async function applyProfileChanges(
  supabase: SessionClient,
  userId: string,
  current: CurrentProfile,
  requested: ProfileChanges,
): Promise<ActionResult<ProfileErrors>> {
  const { email: requestedEmail, ...requestedNames } = requested;
  const effective = diffProfileChanges(current, {
    ...requestedNames,
    ...(current.email !== undefined && { email: requestedEmail }),
  });
  if (Object.keys(effective).length === 0) return { status: "ok" };

  const errors = validateProfileChanges(effective);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  if (effective.email !== undefined) {
    const emailResult = await changeEmail(userId, effective.email);
    if (emailResult.status !== "ok") return emailResult;
  }

  const namesResult = await changeNames(supabase, userId, effective);
  if (namesResult.status !== "ok") return namesResult;

  refresh();
  return { status: "ok" };
}
