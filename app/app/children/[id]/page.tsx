import { notFound } from "next/navigation";
import { familyData } from "@/services/family";
import { balanceOf } from "@/lib/format";
import { PageTitle, Card, Feedback, Empty, Badge } from "@/components/ui";
import { History } from "@/features/children/summary";
import { ActivityCard } from "@/features/activities/cards";
import { ChildForm } from "@/features/manage/forms";
export default async function ChildDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const d = await familyData();
  const c = d.children.find((c) => c.id === id);
  if (!c || !d.family) notFound();
  const activities = d.activities.filter((a) => a.child_id === id);
  const requests = d.redemptions.filter((r) => r.child_id === id);
  return (
    <>
      <PageTitle
        title={`${c.avatar} A jornada de ${c.name}`}
        description={`✦ ${balanceOf(d.transactions, id)} pontos disponíveis`}
      />
      <Feedback searchParams={searchParams} />
      <div className="dashboard-grid">
        <div className="stack">
          <h2>Atividades</h2>
          {activities.length ? (
            activities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                child={c}
                subject={d.subjects.find((s) => s.id === a.subject_id)}
              />
            ))
          ) : (
            <Card>
              <Empty>Nenhuma atividade ainda.</Empty>
            </Card>
          )}
          <History
            transactions={d.transactions.filter((t) => t.child_id === id)}
          />
        </div>
        <div className="stack">
          <Card>
            <ChildForm
              familyId={d.family.id}
              child={c}
              returnTo={`/app/children/${id}`}
            />
          </Card>
          <Card>
            <h2>Recompensas solicitadas</h2>
            {requests.length ? (
              requests.map((r) => (
                <div className="list-item" key={r.id}>
                  <div className="grow">
                    <h3>{d.rewards.find((v) => v.id === r.reward_id)?.name}</h3>
                    <span className="points">{r.points_cost} pontos</span>
                  </div>
                  <Badge status={r.status} />
                </div>
              ))
            ) : (
              <Empty>Nenhuma solicitação ainda.</Empty>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
