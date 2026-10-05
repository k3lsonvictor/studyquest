import { session } from "@/services/family";
import type { AvatarData } from "@/types";

export async function avatarData(childId: string): Promise<AvatarData | null> {
  const { db } = await session();
  const results = await Promise.all([
    db.from("avatar_items").select("*").order("sort_order"),
    db.from("child_avatar_items").select("*").eq("child_id", childId),
    db.from("child_avatar_equipment").select("*").eq("child_id", childId),
  ]);
  // Older hosted projects remain usable until the incremental migration is run.
  if (
    results.some((r) => r.error && ["42P01", "PGRST205"].includes(r.error.code))
  )
    return null;
  if (results.some((r) => r.error))
    throw new Error("Não foi possível carregar seu avatar. Tente novamente.");
  return {
    catalog: results[0].data,
    owned: results[1].data,
    equipment: results[2].data,
  } as AvatarData;
}
