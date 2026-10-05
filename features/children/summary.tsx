import Link from "next/link";
import { mutate } from "@/app/actions";
import { Card, Hidden, Empty } from "@/components/ui";
import { Submit } from "@/components/forms";
import { points, dateLabel } from "@/lib/format";
import type { Child, Transaction } from "@/types";
export function ChildCard({
  child,
  balance,
}: {
  child: Child;
  balance: number;
}) {
  return (
    <Card className="child-card">
      <Link className="row" href={`/app/children/${child.id}`}>
        <span className="child-avatar">{child.avatar}</span>
        <div>
          <h3>{child.name}</h3>
          <span className="small muted">Uma conquista de cada vez</span>
        </div>
      </Link>
      <div className="between">
        <span className="points">✦ {points(balance)} pontos</span>
        <Link className="text-link" href={`/app/children/${child.id}`}>
          Ver jornada →
        </Link>
      </div>
      <form action={mutate} style={{ marginTop: 15 }}>
        <Hidden
          values={{ action: "kid", id: child.id, returnTo: "/app/children" }}
        />
        <Submit variant="secondary wide">Entrar no modo criança</Submit>
      </form>
    </Card>
  );
}
export function History({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <h2>Histórico de pontos</h2>
      {transactions.length ? (
        transactions.map((t) => (
          <div className="history-row" key={t.id}>
            <div>
              <h3>{t.description}</h3>
              <span className="small muted">
                {dateLabel(t.created_at)} ·{" "}
                {t.type === "activity"
                  ? "Atividade"
                  : t.type === "reward"
                    ? "Recompensa"
                    : t.type === "avatar"
                      ? "Loja do avatar"
                      : "Ajuste"}
              </span>
            </div>
            <span className={t.amount > 0 ? "positive" : "negative"}>
              {t.amount > 0 ? "+" : ""}
              {points(t.amount)}
            </span>
          </div>
        ))
      ) : (
        <Empty>As primeiras conquistas vão aparecer aqui.</Empty>
      )}
    </Card>
  );
}
