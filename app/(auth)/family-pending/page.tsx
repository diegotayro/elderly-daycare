import type { Metadata } from "next";
import { FamilyPendingView } from "@/auth/components/FamilyPendingView";
import { requireRelativeUser } from "@/auth/require-user";

export const metadata: Metadata = {
  title: "Acceso para familias · Casa Nogal",
};

export default async function FamilyPendingPage() {
  await requireRelativeUser();

  return <FamilyPendingView />;
}
