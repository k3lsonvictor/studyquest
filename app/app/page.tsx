import Link from "next/link";
import { redirect } from "next/navigation";
import { familyData } from "@/services/family";
import { balanceOf } from "@/lib/format";
import { PageTitle, Card, Empty, Feedback, Badge } from "@/components/ui";
import { ChildCard } from "@/features/children/summary";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  if (!d.family) redirect("/onboarding");
  const pending = d.activities.filter(
    (a) => a.status === "pending" || a.status === "rejected",
  );
  const approvals = d.activities.filter(
    (a) => a.status === "awaiting_approval",
  );
  const completed = d.activities
    .filter((a) => a.status === "completed")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  return (
    <>
      <Feedback searchParams={searchParams} />
      <PageTitle
        eyebrow={d.family.name}
        title="Uma nova oportunidade de aprender ☀"
        description="Acompanhe as pequenas conquistas da sua família."
        action={
          <Link className="button" href="/app/activities/new">
            ＋ Criar atividade
          </Link>
        }
      />
      <div className="hero">
        <div>
          <p className="eyebrow">Juntos, a gente vai mais longe</p>
          <h2>Cada pequeno esforço merece ser celebrado.</h2>
          <p>
            Crie missões, incentive a curiosidade e transforme o aprendizado em
            bons momentos.
          </p>
          <Link className="button secondary" href="/app/rewards/new">
            Criar uma recompensa →
          </Link>
        </div>
        <span className="hero-art" aria-hidden>
          ✦
        </span>
      </div>
      <div className="grid-3 stats">
        {[
          ["📚", pending.length, "Missões pendentes"],
          ["⏳", approvals.length, "Para aprovar"],
          ["✓", completed.length, "Conquistas"],
        ].map(([icon, n, label]) => (
          <Card key={String(label)} className="stat">
            <span className="stat-icon">{icon}</span>
            <div>
              <strong>{n}</strong>
              <p>{label}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <section>
            <div className="section-head">
              <h2>Nossos aventureiros</h2>
              <Link href="/app/children" className="text-link">
                ＋ Adicionar criança
              </Link>
            </div>
            {d.children.length ? (
              <div className="grid-2">
                {d.children.map((c) => (
                  <ChildCard
                    key={c.id}
                    child={c}
                    balance={balanceOf(d.transactions, c.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <Empty>Vamos criar sua primeira criança.</Empty>
                <Link className="button wide" href="/onboarding">
                  Começar agora
                </Link>
              </Card>
            )}
          </section>
          <Card>
            <div className="section-head">
              <h2>Próximas missões</h2>
              <Link href="/app/activities" className="text-link">
                Ver todas →
              </Link>
            </div>
            {pending.length ? (
              pending.slice(0, 4).map((a) => {
                const s = d.subjects.find((s) => s.id === a.subject_id);
                return (
                  <div className="list-item" key={a.id}>
                    <span className="list-icon">{s?.icon || "📚"}</span>
                    <div className="grow">
                      <h3>{a.title}</h3>
                      <p className="small muted">
                        {d.children.find((c) => c.id === a.child_id)?.name} ·{" "}
                        {s?.name}
                      </p>
                    </div>
                    <span className="points">+{a.points}</span>
                  </div>
                );
              })
            ) : (
              <Empty>
                Nenhuma missão pendente. Que tal uma nova descoberta?
              </Empty>
            )}
          </Card>
        </div>
        <div className="stack">
          <Card>
            <div className="section-head">
              <h2>Esperando seu olhar</h2>
              <span className="badge awaiting_approval">
                {approvals.length}
              </span>
            </div>
            <p className="small muted">
              Um incentivo seu faz toda a diferença.
            </p>
            {approvals.length ? (
              approvals.slice(0, 3).map((a) => (
                <div className="list-item" key={a.id}>
                  <span className="list-icon">✨</span>
                  <div>
                    <h3>{a.title}</h3>
                    <span className="small muted">
                      {d.children.find((c) => c.id === a.child_id)?.name} · +
                      {a.points} pontos
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <Empty>Tudo em dia por aqui!</Empty>
            )}
            <Link
              className="button secondary wide"
              style={{ marginTop: 20 }}
              href="/app/approvals"
            >
              Conferir atividades →
            </Link>
            <Link
              className="text-link"
              href="/app/redemptions"
              style={{ display: "block", marginTop: 15 }}
            >
              Resgates aguardando:{" "}
              {d.redemptions.filter((r) => r.status === "pending").length} →
            </Link>
          </Card>
          <Card>
            <h2>Últimas conquistas</h2>
            {completed.length ? (
              completed.slice(0, 3).map((a) => (
                <div className="list-item" key={a.id}>
                  <div className="grow">
                    <h3>{a.title}</h3>
                    <p className="small muted">
                      {d.children.find((c) => c.id === a.child_id)?.name}
                    </p>
                  </div>
                  <Badge status="completed" />
                </div>
              ))
            ) : (
              <Empty>As conquistas começam com a primeira missão.</Empty>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
