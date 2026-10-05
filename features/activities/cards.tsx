import Link from "next/link";
import { mutate } from "@/app/actions";
import { Badge, Card, Hidden } from "@/components/ui";
import { Submit, ConfirmForm } from "@/components/forms";
import { dateLabel, points } from "@/lib/format";
import type { Activity, Child, Subject } from "@/types";
export function ActivityCard({
  activity: a,
  child,
  subject,
  kid = false,
  review = false,
  returnTo = "/app/activities",
}: {
  activity: Activity;
  child?: Child;
  subject?: Subject;
  kid?: boolean;
  review?: boolean;
  returnTo?: string;
}) {
  const editable = ["pending", "rejected"].includes(a.status);
  return (
    <Card className="activity-card">
      <div className="between">
        <span className="small muted">
          {subject?.icon} {subject?.name}
        </span>
        <Badge status={a.status} />
      </div>
      <h3>{a.title}</h3>
      {a.description && <p className="description">{a.description}</p>}
      <div className="row small muted">
        {!kid && (
          <span>
            {child?.avatar} {child?.name}
          </span>
        )}
        {a.due_date && <span>Até {dateLabel(a.due_date)}</span>}
      </div>
      <div className="between activity-footer">
        <span className="points">✦ +{points(a.points)} pontos</span>
        {kid && editable && (
          <form action={mutate}>
            <Hidden values={{ action: "complete", id: a.id, returnTo }} />
            <Submit>
              {a.status === "rejected" ? "Enviar novamente" : "Concluir"} ✓
            </Submit>
          </form>
        )}
        {!kid && !review && editable && (
          <div className="row">
            <Link className="text-link" href={`/app/activities/new?id=${a.id}`}>
              Editar
            </Link>
            <ConfirmForm action={mutate}>
              <Hidden values={{ action: "delete", id: a.id, returnTo }} />
              <Submit variant="danger small">Excluir</Submit>
            </ConfirmForm>
          </div>
        )}
      </div>
      {review && (
        <form action={mutate} className="row">
          <Hidden values={{ action: "review_activity", id: a.id, returnTo }} />
          <Submit name="approve" value="true">
            Aprovar
          </Submit>
          <Submit variant="danger" name="approve" value="false">
            Rejeitar
          </Submit>
        </form>
      )}
      {kid && a.status === "awaiting_approval" && (
        <p className="small muted">
          Seu responsável vai conferir. Os pontos chegam após a aprovação.
        </p>
      )}
    </Card>
  );
}
