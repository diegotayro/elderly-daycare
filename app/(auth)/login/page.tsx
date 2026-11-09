import type { Metadata } from "next";
import { LoginView } from "@/auth/components/LoginView";

export const metadata: Metadata = {
  title: "Iniciar sesión · Casa Nogal",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LoginView searchParams={searchParams} />;
}
