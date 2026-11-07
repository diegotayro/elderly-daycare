import type { Metadata } from "next";
import { AccountView } from "@/account/components/AccountView";

export const metadata: Metadata = {
  title: "Mi cuenta · Casa Nogal",
};

export default function AccountPage() {
  return <AccountView />;
}
