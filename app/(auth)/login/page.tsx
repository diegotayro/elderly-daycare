import type { Metadata } from "next";
import { LoginView } from "@/auth/components/LoginView";

export const metadata: Metadata = {
  title: "Iniciar sesión · Casa Nogal",
};

export default function LoginPage() {
  return <LoginView />;
}
