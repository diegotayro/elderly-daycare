import type { Metadata } from "next";
import { AcceptInvite } from "@/auth/components/AcceptInvite";

export const metadata: Metadata = {
  title: "Preparando tu cuenta · Casa Nogal",
};

export default function AcceptInvitePage() {
  return <AcceptInvite />;
}
