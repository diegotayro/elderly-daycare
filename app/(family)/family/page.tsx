import type { Metadata } from "next";
import { requireRelativeUser } from "@/auth/require-user";
import { FamilyFeedView } from "@/family/components/FamilyFeedView";

export const metadata: Metadata = {
  title: "Feed · Casa Nogal",
};

export default async function FamilyFeedPage() {
  const user = await requireRelativeUser();

  return <FamilyFeedView firstName={user.first_name} />;
}
