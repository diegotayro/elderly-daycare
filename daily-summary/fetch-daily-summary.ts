import "server-only";
import { cookies } from "next/headers";
import type {
  DailySummaryRow,
  ListSummaryPostsRow,
} from "@/shared/database/types";
import { createClient } from "@/shared/supabase/server";
import { buildDailySummary } from "./build-daily-summary";
import type { DailySummaryData } from "./types";

type FetchDailySummaryParams = {
  elderlyId: string;
  firstName: string;
  day: string;
  audience: "team" | "family";
};

// La RLS decide qué ve quien llama: el familiar solo recibe resúmenes enviados
export async function fetchDailySummary({
  elderlyId,
  firstName,
  day,
  audience,
}: FetchDailySummaryParams): Promise<DailySummaryData> {
  const supabase = createClient(await cookies());

  const [rowResult, postsResult] = await Promise.all([
    supabase
      .from("daily_summaries")
      .select("*")
      .eq("elderly_id", elderlyId)
      .eq("date", day)
      .maybeSingle<DailySummaryRow>(),
    supabase.rpc("list_summary_posts", { p_elderly_id: elderlyId, p_day: day }),
  ]);
  if (rowResult.error) throw rowResult.error;
  if (postsResult.error) throw postsResult.error;

  return buildDailySummary({
    elderlyId,
    firstName,
    day,
    row: rowResult.data,
    // El cliente no está tipado con Database: se declara la forma que devuelve la función
    posts: (postsResult.data ?? []) as ListSummaryPostsRow[],
    postHrefPrefix: audience === "team" ? "/posts" : "/family/posts",
  });
}
