import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
};

// Devuelve si el correo salió; nunca lanza, quien llama decide qué hacer si falla
export async function sendEmail({
  to,
  subject,
  react,
}: SendEmailInput): Promise<boolean> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      react,
    });
    if (error) console.error("[sendEmail] Resend error:", error);
    return !error;
  } catch (exception) {
    console.error("[sendEmail] Unexpected error:", exception);
    return false;
  }
}
