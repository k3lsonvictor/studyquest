import Link from "next/link";
import { familyData } from "@/services/family";
import { PageTitle, Feedback, Card, Empty } from "@/components/ui";
import { points } from "@/lib/format";
export default async function Rewards({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  return (
    <>
      <PageTitle
        title="Motivos para ir além"
        description="Boas recompensas começam com bons combinados."
        action={
          <Link className="button" href="/app/rewards/new">
            ＋ Criar recompensa
          </Link>
        }
      />
      <Feedback searchParams={searchParams} />
      <div className="section-head">
        <p className="muted small">
          Momentos especiais também são grandes recompensas.
        </p>
        <Link className="text-link" href="/app/redemptions">
          Ver solicitações →
        </Link>
      </div>
      {d.rewards.length ? (
        <div className="grid-3">
          {d.rewards.map((r, i) => (
            <Card key={r.id} className="reward-card">
              <div className="reward-art" aria-hidden>
                {["🎮", "🎬", "🍿", "🎨", "🎁"][i % 5]}
              </div>
              <h3>{r.name}</h3>
              <span className={`badge ${r.active ? "completed" : "rejected"}`}>
                {r.active ? "Disponível" : "Desativada"}
              </span>
              <p className="description small muted">
                {r.description || "Uma conquista para celebrar em família."}
              </p>
              <div className="between">
                <span className="points">✦ {points(r.points_cost)}</span>
                <Link
                  className="button secondary small"
                  href={`/app/rewards/new?id=${r.id}`}
                >
                  Editar
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Empty>
            Crie a primeira recompensa e combine uma meta com a criança.
          </Empty>
        </Card>
      )}
    </>
  );
}
