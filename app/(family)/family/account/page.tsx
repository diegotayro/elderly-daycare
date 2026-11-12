import type { Metadata } from "next";
import { requireRelativeUser } from "@/auth/require-user";

export const metadata: Metadata = {
  title: "Mi cuenta · Casa Nogal",
};

export default async function FamilyAccountPage() {
  await requireRelativeUser();

  return (
    <div className="px-4 pt-5 pb-8 lg:px-10 lg:pt-[34px] lg:pb-20">
      <h1 className="font-display text-[26px] font-semibold text-ink">
        Mi cuenta
      </h1>
    </div>
  );
}
