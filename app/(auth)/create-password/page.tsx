import type { Metadata } from "next";
import { Suspense } from "react";
import { CreatePasswordContent } from "@/auth/components/CreatePasswordContent";
import { CreatePasswordView } from "@/auth/components/CreatePasswordView";

export const metadata: Metadata = {
  title: "Crear contraseña · Casa Nogal",
};

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={<CreatePasswordView disabled />}>
      <CreatePasswordContent />
    </Suspense>
  );
}
