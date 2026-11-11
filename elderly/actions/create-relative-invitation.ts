"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/auth/get-current-user";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RelationshipType } from "@/shared/database/types";
import { sendEmail } from "@/shared/email/resend";
import { createClient } from "@/shared/supabase/server";
import { RelativeInvitationEmail } from "../emails/RelativeInvitationEmail";
import { readRelativeInvitationInput } from "../read-relative-invitation-input";
import { relativeInvitationMessages as messages } from "../relative-invitation-messages";
import type {
  CreateRelativeInvitationResult,
  RelativeInvitationErrors,
} from "../types";
import { validateRelativeInvitation } from "../validate-relative-invitation";

const MAX_CODE_ATTEMPTS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const POSTGRES_UNIQUE_VIOLATION = "23505";

type NewInvitation = {
  elderlyId: string;
  invitedBy: string;
  firstName: string;
  lastName: string;
  email: string;
  relationship: RelationshipType;
};

type InsertedInvitation = { code: string; expires_at: string };
type InsertOutcome =
  | { kind: "inserted"; invitation: InsertedInvitation }
  | { kind: "pending_conflict" }
  | { kind: "failed" };

// Las pending vencidas no deben bloquear una invitación nueva
async function expireStalePending(
  supabase: SupabaseClient,
  elderlyId: string,
  email: string,
) {
  const { error } = await supabase
    .from("invitations")
    .update({ status: "expired" })
    .eq("elderly_id", elderlyId)
    .eq("email", email)
    .eq("status", "pending")
    .lte("expires_at", new Date().toISOString());
  if (error) throw error;
}

async function findLivePendingId(
  supabase: SupabaseClient,
  elderlyId: string,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("invitations")
    .select("id")
    .eq("elderly_id", elderlyId)
    .eq("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function cancelInvitation(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;
}

// Reintenta solo si el código generado ya existía
async function insertInvitation(
  supabase: SupabaseClient,
  invitation: NewInvitation,
): Promise<InsertOutcome> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({
        elderly_id: invitation.elderlyId,
        invited_by: invitation.invitedBy,
        first_name: invitation.firstName,
        last_name: invitation.lastName,
        email: invitation.email,
        relationship: invitation.relationship,
      })
      .select("code, expires_at")
      .single<InsertedInvitation>();
    if (!error) return { kind: "inserted", invitation: data };

    const isUniqueViolation = error.code === POSTGRES_UNIQUE_VIOLATION;
    if (isUniqueViolation && error.message.includes("invitations_code_key")) {
      continue;
    }
    if (
      isUniqueViolation &&
      error.message.includes("invitations_elderly_id_email_pending_key")
    ) {
      return { kind: "pending_conflict" };
    }
    console.error("createRelativeInvitation: no se pudo insertar", error);
    return { kind: "failed" };
  }
  console.error("createRelativeInvitation: código repetido en cada intento");
  return { kind: "failed" };
}

async function validateAgainstDatabase(
  supabase: SupabaseClient,
  elderlyId: string,
  elderlyFirstName: string,
  email: string,
): Promise<RelativeInvitationErrors> {
  const [linked, team] = await Promise.all([
    supabase.rpc("is_email_linked_to_elderly", {
      p_elderly_id: elderlyId,
      p_email: email,
    }),
    supabase.rpc("is_team_email", { p_email: email }),
  ]);
  if (linked.error) throw linked.error;
  if (team.error) throw team.error;

  if (linked.data) {
    return { email: messages.emailAlreadyLinked(elderlyFirstName) };
  }
  if (team.data) return { email: messages.emailBelongsToTeam };
  return {};
}

function getExpiresInDays(expiresAt: string): number {
  return Math.round((new Date(expiresAt).getTime() - Date.now()) / MS_PER_DAY);
}

export async function createRelativeInvitation(
  elderlyId: string,
  formData: FormData,
): Promise<CreateRelativeInvitationResult> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { status: "error" };

  const input = readRelativeInvitationInput(formData);
  const formErrors = validateRelativeInvitation(input);
  if (Object.keys(formErrors).length > 0) {
    return { status: "invalid", errors: formErrors };
  }

  const supabase = createClient(await cookies());
  try {
    // RLS limita la lectura a los adultos mayores de su guardería
    const { data: elderly, error: elderlyError } = await supabase
      .from("elderly")
      .select("first_name, full_name, status")
      .eq("id", elderlyId)
      .maybeSingle();
    if (elderlyError) throw elderlyError;
    if (elderly?.status !== "active") return { status: "error" };

    const email = input.email.trim().toLowerCase();
    const databaseErrors = await validateAgainstDatabase(
      supabase,
      elderlyId,
      elderly.first_name,
      email,
    );
    if (Object.keys(databaseErrors).length > 0) {
      return { status: "invalid", errors: databaseErrors };
    }

    await expireStalePending(supabase, elderlyId, email);
    const livePendingId = await findLivePendingId(supabase, elderlyId, email);
    if (livePendingId) {
      if (formData.get("replacePending") !== "true") {
        return { status: "needs_replace_confirmation" };
      }
      await cancelInvitation(supabase, livePendingId);
    }

    const outcome = await insertInvitation(supabase, {
      elderlyId,
      invitedBy: user.id,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      relationship: input.relationship as RelationshipType,
    });
    if (outcome.kind === "pending_conflict") {
      return { status: "needs_replace_confirmation" };
    }
    if (outcome.kind === "failed") return { status: "error" };

    const { code, expires_at: expiresAt } = outcome.invitation;
    const expiresInDays = getExpiresInDays(expiresAt);
    const emailSent = await sendEmail({
      to: email,
      subject: `Te invitaron a seguir a ${elderly.full_name} en Casa Nogal`,
      react: RelativeInvitationEmail({
        relativeFirstName: input.firstName.trim(),
        elderlyFullName: elderly.full_name,
        code,
        expiresInDays,
        activationUrl: `${process.env.APP_URL}/activate-account?code=${code}`,
      }),
    });

    refresh();
    return { status: "success", code, email, expiresInDays, emailSent };
  } catch (error) {
    console.error("createRelativeInvitation: falló la operación", error);
    return { status: "error" };
  }
}
