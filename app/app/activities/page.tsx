import Link from "next/link";
import { familyData } from "@/services/family";
import { PageTitle, Feedback, Field, Empty, Card } from "@/components/ui";
import { ActivityCard } from "@/features/activities/cards";
import { statusLabels } from "@/lib/format";
export default async function Activities({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  const q = await searchParams;
  const list = d.activities.filter(
    (a) =>
      (!q.child || a.child_id === q.child) &&
      (!q.subject || a.subject_id === q.subject) &&
      (!q.status || a.status === q.status),
  );
  return (
    <>
      <PageTitle
        title="Pequenas missões, grandes passos"
        description="Atividades que despertam a vontade de aprender."
        action={
          <Link className="button" href="/app/activities/new">
            ＋ Criar atividade
          </Link>
        }
      />
      <Feedback searchParams={searchParams} />
      <form className="filters">
        <Field label="Criança">
          <select name="child" defaultValue={q.child || ""}>
            <option value="">Todas</option>
            {d.children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoria ou matéria">
          <select name="subject" defaultValue={q.subject || ""}>
            <option value="">Todas</option>
            {d.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={q.status || ""}>
            <option value="">Todos</option>
            {["pending", "awaiting_approval", "completed", "rejected"].map(
              (s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ),
            )}
          </select>
        </Field>
        <button className="button secondary">Filtrar</button>
        <Link href="/app/activities" className="text-link">
          Limpar
        </Link>
      </form>
      {list.length ? (
        <div className="grid-2">
          {list.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              child={d.children.find((c) => c.id === a.child_id)}
              subject={d.subjects.find((s) => s.id === a.subject_id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Empty>
            Nenhuma atividade encontrada. Crie uma missão ou ajuste os filtros.
          </Empty>
        </Card>
      )}
    </>
  );
}
