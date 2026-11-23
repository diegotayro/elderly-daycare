import "server-only";
import { cache } from "react";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { isUuid } from "@/shared/text/is-uuid";
import { createClient } from "@/shared/supabase/server";
import type { ElderlyStatus } from "@/shared/database/types";

export type SummaryElderly = {
  id: string;
  fullName: string;
  firstName: string;
  status: ElderlyStatus;
};

// La RLS limita al admin de su guardería y al staff asignado; null si no existe o no hay acceso.
// React cache evita consultar dos veces entre generateMetadata y la página.
export const getSummaryElderly = cache(
  async (id: string): Promise<SummaryElderly | null> => {
    if (!isUuid(id)) return null;

    // La sesión usa la hora actual: debe quedar fuera del prerender
    await io();

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("elderly")
      .select("id, full_name, first_name, status")
      .eq("id", id)
      .maybeSingle<{
        id: string;
        full_name: string;
        first_name: string;
        status: ElderlyStatus;
      }>();
    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      fullName: data.full_name,
      firstName: data.first_name,
      status: data.status,
    };
  },
);
