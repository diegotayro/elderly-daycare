"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { activateAccountMessages as messages } from "@/auth/activate-account-messages";
import {
  getInvitationPreview,
  type InvitationPreviewRecord,
} from "@/auth/get-invitation-preview";
import { RELATIVE_HOME } from "@/auth/home-routes";
import type {
  ActivateAccountErrors,
  ActivateAccountInput,
  ActivateAccountResult,
  PasswordMode,
} from "@/auth/types";
import { validateActivateAccount } from "@/auth/validate-activate-account";
import { createAdminClient } from "@/shared/supabase/admin";
import { createClient } from "@/shared/supabase/server";

function readInput(formData: FormData): ActivateAccountInput {
  const read = (field: string) => String(formData.get(field) ?? "");
  return {
    code: read("code"),
    email: read("email"),
    password: read("password"),
    photoConsent: formData.get("photoConsent") === "on",
  };
}

function invalid(
  errors: ActivateAccountErrors,
  passwordMode: PasswordMode,
): ActivateAccountResult {
  return { status: "invalid", errors, passwordMode };
}

function failed(
  message: string,
  passwordMode: PasswordMode,
): ActivateAccountResult {
  return { status: "error", message, passwordMode };
}

// null = la cuenta quedó lista; si no, el resultado a devolver
async function createRelativeAccount(
  record: InvitationPreviewRecord,
  password: string,
): Promise<ActivateAccountResult | null> {
  // role y daycare_id los fija el servidor, nunca el formulario
  const { error } = await createAdminClient().auth.admin.createUser({
    email: record.email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: record.firstName,
      last_name: record.lastName,
      role: "relative",
      daycare_id: record.daycareId,
    },
  });
  if (!error) return null;

  // Otra activación creó la cuenta entre la lectura y este punto
  if (error.code === "email_exists") {
    return invalid({ password: messages.accountAlreadyExists }, "existing");
  }
  console.error("activateAccount: no se pudo crear la cuenta", error);
  return failed(messages.unexpected, "create");
}

async function signInRelative(
  supabase: SupabaseClient,
  record: InvitationPreviewRecord,
  password: string,
  accountExisted: boolean,
): Promise<ActivateAccountResult | null> {
  const { error } = await supabase.auth.signInWithPassword({
    email: record.email,
    password,
  });
  if (!error) return null;

  if (error.code === "invalid_credentials" && accountExisted) {
    return invalid({ password: messages.passwordIncorrect }, "existing");
  }
  if (error.code === "user_banned") {
    return failed(messages.accountNotAllowed, "existing");
  }
  console.error("activateAccount: no se pudo iniciar sesión", error);
  return failed(messages.unexpected, accountExisted ? "existing" : "create");
}

async function acceptInvitation(
  supabase: SupabaseClient,
  record: InvitationPreviewRecord,
  photoConsent: boolean,
): Promise<ActivateAccountResult | null> {
  const { error } = await supabase.rpc("accept_invitation", {
    p_code: record.code,
    p_photo_consent: photoConsent,
  });
  if (!error) return null;

  await supabase.auth.signOut();
  const mode: PasswordMode = record.hasAccount ? "existing" : "create";
  if (error.message.includes("not_a_relative")) {
    return failed(messages.accountNotAllowed, mode);
  }
  if (error.message.includes("invitation_not_found")) {
    return invalid({ code: messages.codeInvalid }, mode);
  }
  if (error.message.includes("invitation_email_mismatch")) {
    return invalid({ email: messages.emailMismatch }, mode);
  }
  console.error("activateAccount: no se pudo aceptar la invitación", error);
  return failed(messages.unexpected, mode);
}

export async function activateAccount(
  currentMode: PasswordMode,
  formData: FormData,
): Promise<ActivateAccountResult> {
  const input = readInput(formData);
  const formErrors = validateActivateAccount(input);
  if (Object.keys(formErrors).length > 0) {
    return invalid(formErrors, currentMode);
  }

  let record: InvitationPreviewRecord | null;
  try {
    record = await getInvitationPreview(input.code);
  } catch (error) {
    console.error("activateAccount: no se pudo leer la invitación", error);
    return failed(messages.unexpected, currentMode);
  }
  if (!record) return invalid({ code: messages.codeInvalid }, currentMode);
  if (record.email !== input.email.trim().toLowerCase()) {
    return invalid({ email: messages.emailMismatch }, currentMode);
  }
  if (record.hasAccount && currentMode === "create") {
    return invalid({ password: messages.accountAlreadyExists }, "existing");
  }

  if (!record.hasAccount) {
    const creationFailure = await createRelativeAccount(record, input.password);
    if (creationFailure) return creationFailure;
  }

  const supabase = createClient(await cookies());
  const steps = [
    () => signInRelative(supabase, record, input.password, record.hasAccount),
    () => acceptInvitation(supabase, record, input.photoConsent),
  ];
  for (const step of steps) {
    const failure = await step();
    if (failure) return failure;
  }

  revalidatePath("/", "layout");
  redirect(RELATIVE_HOME);
}
