import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { familyData, session } from "@/services/family";
import { PRODUCT_NAME, demoMode } from "@/lib/config";
import { balanceOf, points } from "@/lib/format";
import { Card, Empty, Feedback, Hidden, Badge } from "@/components/ui";
import { Submit } from "@/components/forms";
import { mutate } from "@/app/actions";
import { ActivityCard } from "@/features/activities/cards";
import { History } from "@/features/children/summary";
import { AvatarProfile } from "@/features/avatar/profile";
import { ProductTour } from "@/features/tour/product-tour";
export const dynamic = "force-dynamic";
export default async function Kid({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { childId } = await params;
  const { kid } = await session();
  const d = await familyData(false);
  const c = d.children.find((c) => c.id === childId);
  if (!c) notFound();
  if (!kid) redirect(`/app/children/${childId}`);
  if (kid !== childId) notFound();
  const q = await searchParams;
  const tab = q.tab || "missions";
  const path = `/kid/${c.id}`;
  const balance = balanceOf(d.transactions, c.id);
  const activities = d.activities.filter((a) => a.child_id === c.id);
  const rewards = d.rewards.filter((r) => r.active);
  const requests = d.redemptions.filter((r) => r.child_id === c.id);
  const tabs = [
    ["missions", "⚑", "Missões"],
    ["rewards", "☆", "Recompensas"],
    ["profile", "☺", "Perfil"],
  ];
  return (
    <main className="kid-shell">
      <header className="kid-header">
        <span className="brand">
          <span className="brand-mark">✦</span>
          {PRODUCT_NAME}
        </span>
        <Link href="/login?parent=1" className="text-link">
          Área do responsável ↗
        </Link>
      </header>
      {demoMode && (
        <div className="notice success small">
          Demonstração local · Conquistas e pontos fictícios.
        </div>
      )}
      <Feedback searchParams={searchParams} />
      <ProductTour role="kid" identity={c.id} />
      <section className="kid-hero">
        <div className="between">
          <div>
            <p className="eyebrow">Sua próxima descoberta está aqui</p>
            <h1>Olá, {c.name}!</h1>
            <p className="muted" style={{ margin: "12px 0" }}>
              Cada missão é um passo na sua aventura.
            </p>
            <p className="points">⭐ {points(balance)} pontos</p>
          </div>
          <span className="child-avatar">{c.avatar}</span>
        </div>
      </section>
      <nav className="kid-tabs" aria-label="Navegação da criança">
        {tabs.map(([key, icon, label]) => (
          <Link
            key={key}
            data-tour-link={key}
            className={`button ${tab === key ? "" : "secondary"}`}
            href={`${path}?tab=${key}`}
          >
            {icon} {label}
          </Link>
        ))}
      </nav>
      {tab === "missions" ? (
        <>
          <div className="section-head">
            <h2>Missões de hoje</h2>
            <span className="small muted">No seu ritmo. Você consegue!</span>
          </div>
          {activities.length ? (
            <div className="grid-2">
              {activities.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  subject={d.subjects.find((s) => s.id === a.subject_id)}
                  kid
                  returnTo={path}
                />
              ))}
            </div>
          ) : (
            <Card>
              <Empty>
                Novas missões estão a caminho. Combine a próxima com seu
                responsável!
              </Empty>
            </Card>
          )}
        </>
      ) : tab === "rewards" ? (
        <>
          <div className="section-head">
            <h2>Sua próxima comemoração</h2>
          </div>
          {rewards.length ? (
            <div className="grid-3">
              {rewards.map((r, i) => {
                const pending = requests.some(
                  (v) => v.reward_id === r.id && v.status === "pending",
                );
                const missing = Math.max(0, r.points_cost - balance);
                return (
                  <Card key={r.id} className="reward-card">
                    <div className="reward-art">
                      {["🎮", "🎬", "🎁"][i % 3]}
                    </div>
                    <h3>{r.name}</h3>
                    <p className="description small muted">
                      {r.description || "Uma conquista para comemorar!"}
                    </p>
                    <p className="points" style={{ marginBottom: 15 }}>
                      ✦ {points(r.points_cost)} pontos
                    </p>
                    <form action={mutate}>
                      <Hidden
                        values={{
                          action: "request",
                          id: r.id,
                          child_id: c.id,
                          returnTo: `${path}?tab=rewards`,
                        }}
                      />
                      <Submit variant="wide" disabled={pending || missing > 0}>
                        {pending
                          ? "Aguardando aprovação"
                          : missing
                            ? `Faltam ${points(missing)} pontos`
                            : "Resgatar"}
                      </Submit>
                    </form>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <Empty>
                Seu responsável vai preparar recompensas especiais para você.
              </Empty>
            </Card>
          )}
          <h2 style={{ margin: "28px 0 15px" }}>Meus pedidos</h2>
          <Card>
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
              <Empty>
                Quando você pedir uma recompensa, ela vai aparecer aqui.
              </Empty>
            )}
          </Card>
        </>
      ) : (
        <>
          <AvatarProfile childId={c.id} name={c.name} balance={balance} />
          <Card className="avatar-achievements">
            <h2>{c.avatar} Minhas conquistas</h2>
            <p className="muted" style={{ marginTop: 10 }}>
              {activities.filter((a) => a.status === "completed").length}{" "}
              missões concluídas. Cada uma delas conta!
            </p>
          </Card>
          <div style={{ marginTop: 20 }}>
            <History
              transactions={d.transactions.filter((t) => t.child_id === c.id)}
            />
          </div>
        </>
      )}
      <nav className="bottom-nav" aria-label="Navegação inferior da criança">
        {tabs.map(([key, icon, label]) => (
          <Link
            key={key}
            data-tour-link={key}
            className={tab === key ? "active" : ""}
            href={`${path}?tab=${key}`}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
