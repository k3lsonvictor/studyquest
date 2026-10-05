import { notFound, redirect } from "next/navigation";
import { familyData } from "@/services/family";
import { PageTitle, Feedback, Card } from "@/components/ui";
import { RewardForm } from "@/features/manage/forms";
export default async function NewReward({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  if (!d.family) redirect("/onboarding");
  const q = await searchParams;
  const r = d.rewards.find((r) => r.id === q.id);
  if (q.id && !r) notFound();
  return (
    <>
      <PageTitle
        title={r ? "Editar recompensa" : "O próximo motivo para comemorar"}
        description="Escolha algo especial e um custo em pontos alcançável."
      />
      <Feedback searchParams={searchParams} />
      <Card>
        <RewardForm familyId={d.family.id} reward={r} />
      </Card>
    </>
  );
}
