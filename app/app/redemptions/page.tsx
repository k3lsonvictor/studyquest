import { familyData } from "@/services/family";
import {
  PageTitle,
  Feedback,
  Card,
  Empty,
  Hidden,
  Badge,
} from "@/components/ui";
import { Submit } from "@/components/forms";
import { mutate } from "@/app/actions";
import { balanceOf, dateLabel } from "@/lib/format";
export default async function Redemptions({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  return (
    <>
      <PageTitle
        title="Hora de celebrar"
        description="Confira as solicitações de recompensa. Os pontos só são descontados ao aprovar."
      />
      <Feedback searchParams={searchParams} />
      {d.redemptions.length ? (
        <div className="grid-2">
          {d.redemptions.map((r) => {
            const c = d.children.find((c) => c.id === r.child_id);
            return (
              <Card key={r.id}>
                <div className="between">
                  <span className="small muted">
                    {c?.avatar} {c?.name}
                  </span>
                  <Badge status={r.status} />
                </div>
                <h2 style={{ marginTop: 15 }}>
                  {d.rewards.find((v) => v.id === r.reward_id)?.name}
                </h2>
                <p className="muted small" style={{ marginTop: 9 }}>
                  Pedido em {dateLabel(r.requested_at)}
                </p>
                <div className="row" style={{ margin: "18px 0" }}>
                  <span className="points">Custo: {r.points_cost} pontos</span>
                  <span className="small muted">
                    Saldo atual: {balanceOf(d.transactions, r.child_id)} pontos
                  </span>
                </div>
                {r.status === "pending" && (
                  <form action={mutate} className="row">
                    <Hidden
                      values={{
                        action: "review_reward",
                        id: r.id,
                        returnTo: "/app/redemptions",
                      }}
                    />
                    <Submit name="approve" value="true">
                      Aprovar resgate
                    </Submit>
                    <Submit variant="danger" name="approve" value="false">
                      Rejeitar
                    </Submit>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Empty>
            Nenhum pedido por enquanto. As próximas comemorações aparecem aqui.
          </Empty>
        </Card>
      )}
    </>
  );
}
