import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { configured } from "@/lib/config";
import type { FamilyData } from "@/types";

export async function session(parentOnly = false) {
  if (!configured) redirect("/?setup=1");
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: kid, error } = await db.rpc("kid_id");
  if (error)
    throw new Error(
      "Não foi possível acessar o banco. Confira a aplicação do schema.sql.",
    );
  if (parentOnly && kid) redirect(`/kid/${kid}`);
  return { db, user, kid: kid as string | null };
}

export async function familyData(parentOnly = true): Promise<FamilyData> {
  const { db } = await session(parentOnly);
  // Read to exhaustion so an API row cap cannot silently truncate the ledger
  // and show an incorrect balance. Always advance by the actual returned size.
  async function allRows(table: string, order: string, ascending = true) {
    const rows: Record<string, unknown>[] = [];
    for (;;) {
      const result = await db
        .from(table)
        .select("*")
        .order(order, { ascending })
        .order("id")
        .range(rows.length, rows.length + 499);
      if (result.error)
        throw new Error(
          "Não foi possível carregar os dados da família. Tente novamente.",
        );
      if (!result.data.length) return { data: rows, error: null };
      rows.push(...result.data);
    }
  }
  const results = await Promise.all([
    db.from("families").select("*").maybeSingle(),
    allRows("children", "created_at"),
    allRows("subjects", "created_at"),
    allRows("activities", "created_at", false),
    allRows("rewards", "created_at"),
    allRows("reward_redemptions", "requested_at", false),
    allRows("points_transactions", "created_at", false),
  ]);
  if (results.some((r) => r.error))
    throw new Error(
      "Não foi possível carregar os dados da família. Tente novamente.",
    );
  return {
    family: results[0].data,
    children: results[1].data ?? [],
    subjects: results[2].data ?? [],
    activities: results[3].data ?? [],
    rewards: results[4].data ?? [],
    redemptions: results[5].data ?? [],
    transactions: results[6].data ?? [],
  } as FamilyData;
}
