import Link from "next/link";
import { familyData } from "@/services/family";
import { PageTitle, Feedback, Card, Empty } from "@/components/ui";
import { ActivityCard } from "@/features/activities/cards";
export default async function Approvals({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  const list = d.activities.filter((a) => a.status === "awaiting_approval");
  return (
    <>
      <PageTitle
        title="Atividades aguardando aprovação"
        description="Confira o esforço, celebre a conquista e libere os pontos."
        action={
          <Link className="button secondary" href="/app/redemptions">
            Solicitações de recompensa →
          </Link>
        }
      />
      <Feedback searchParams={searchParams} />
      {list.length ? (
        <div className="grid-2">
          {list.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              child={d.children.find((c) => c.id === a.child_id)}
              subject={d.subjects.find((s) => s.id === a.subject_id)}
              review
              returnTo="/app/approvals"
            />
          ))}
        </div>
      ) : (
        <Card>
          <Empty>Tudo em dia! As atividades enviadas vão aparecer aqui.</Empty>
        </Card>
      )}
    </>
  );
}
