import Link from "next/link";
import { familyData, session } from "@/services/family";
import { PageTitle, Feedback, Card, Hidden } from "@/components/ui";
import { Submit } from "@/components/forms";
import { logout, mutate } from "@/app/actions";
export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { user } = await session(true);
  const d = await familyData();
  return (
    <>
      <PageTitle
        title="Nosso cantinho"
        description="Sua conta e os atalhos da família."
      />
      <Feedback searchParams={searchParams} />
      <div className="grid-2">
        <Card>
          <p className="eyebrow">Responsável</p>
          <h2>{user.user_metadata.name || "Sua conta"}</h2>
          <p className="muted wrap">{user.email}</p>
          <div className="divider" />
          <h3>{d.family?.name || "Crie sua família"}</h3>
          <p className="muted small">
            {d.children.length} criança(s) · {d.subjects.length} categoria(s)
          </p>
          <form action={logout} style={{ marginTop: 24 }}>
            <Submit variant="ghost">Sair da conta</Submit>
          </form>
        </Card>
        <Card>
          <h2>Organizar nossa jornada</h2>
          <div className="stack" style={{ marginTop: 20 }}>
            <Link className="button secondary" href="/app/children">
              Crianças
            </Link>
            <Link className="button secondary" href="/app/subjects">
              Matérias e categorias
            </Link>
            <Link className="button secondary" href="/app/redemptions">
              Solicitações de recompensa
            </Link>
            <Link className="text-link" href="/onboarding">
              Continuar configuração inicial →
            </Link>
          </div>
        </Card>
      </div>
      {!d.family && (
        <Card className="setup">
          <h2>Conheça com dados de exemplo</h2>
          <p className="muted small" style={{ margin: "10px 0 18px" }}>
            Cria a Família Silva, Lucas, quatro matérias, três atividades e três
            recompensas. Disponível apenas antes de criar sua família.
          </p>
          <form action={mutate}>
            <Hidden values={{ action: "seed", returnTo: "/app" }} />
            <Submit variant="secondary">Criar família de exemplo</Submit>
          </form>
        </Card>
      )}
    </>
  );
}
