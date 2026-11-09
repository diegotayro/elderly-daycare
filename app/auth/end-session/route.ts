import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/shared/supabase/server";

// Un Server Component no puede escribir cookies; este handler cierra la
// sesión de una cuenta no activa y evita el bucle entre "/" y "/login".
export async function GET() {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();

  redirect("/login?error=inactive_account");
}
