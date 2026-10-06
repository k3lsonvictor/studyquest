import Link from "next/link";
import { familyData } from "@/services/family";
import { PRODUCT_NAME } from "@/lib/config";
import { mutate } from "@/app/actions";
import { Card, PageTitle, Feedback, Field, Hidden } from "@/components/ui";
import { Submit } from "@/components/forms";
import { ChildForm, SubjectForm, RewardForm } from "@/features/manage/forms";
export const dynamic = "force-dynamic";
export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  const q = await searchParams;
  const suggested = !d.family
    ? 1
    : !d.children.length
      ? 2
      : !d.subjects.length
        ? 3
        : 4;
  const step = d.family
    ? Math.min(4, Math.max(2, Number(q.step) || suggested))
    : 1;
  return (
    <main className="onboarding">
      <Link className="brand" href="/">
        <span className="brand-mark">✦</span>
        {PRODUCT_NAME}
      </Link>
      <div style={{ marginTop: 35 }}>
        <PageTitle
          eyebrow={`Passo ${step} de 4`}
          title="Vamos preparar nossa jornada?"
          description="Comece com o básico. Você pode completar tudo depois."
        />
      </div>
      <div className="steps" aria-label={`Passo ${step} de 4`}>
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={n <= step ? "done" : ""} />
        ))}
      </div>
      <Feedback searchParams={searchParams} />
      <Card>
        {step === 1 ? (
          <form action={mutate} className="form">
            <Hidden values={{ action: "family", returnTo: "/onboarding" }} />
            <h2>Como vamos chamar sua família?</h2>
            <Field label="Nome da família">
              <input
                name="name"
                required
                maxLength={100}
                placeholder="Ex.: Família Silva"
              />
            </Field>
            <Submit>Criar família e continuar →</Submit>
          </form>
        ) : step === 2 ? (
          <>
            <p className="muted" style={{ marginBottom: 20 }}>
              Vamos criar sua primeira criança.
            </p>
            <ChildForm familyId={d.family!.id} returnTo="/onboarding" />
          </>
        ) : step === 3 ? (
          <>
            <SubjectForm familyId={d.family!.id} returnTo="/onboarding" />
            {d.subjects.length > 0 && (
              <p className="muted small" style={{ marginTop: 16 }}>
                {d.subjects.length} categoria(s) cadastrada(s).
              </p>
            )}
          </>
        ) : d.rewards.length ? (
          <>
            <h2>Tudo pronto para a primeira missão! ✨</h2>
            <p className="muted" style={{ margin: "16px 0" }}>
              Agora é só criar uma atividade e começar a colecionar descobertas.
            </p>
            <Link className="button" href="/app/activities/new">
              Criar primeira atividade →
            </Link>
          </>
        ) : (
          <RewardForm familyId={d.family!.id} returnTo="/onboarding" />
        )}
      </Card>
      <div className="between" style={{ marginTop: 22 }}>
        <Link href="/app/profile" className="text-link">
          Configurar depois
        </Link>
        {d.family && step < 4 && (
          <Link
            className="button secondary"
            href={`/onboarding?step=${step + 1}`}
          >
            Próximo passo →
          </Link>
        )}
        {d.family && step === 4 && (
          <Link className="button secondary" href="/app">
            Ir para o início →
          </Link>
        )}
      </div>
      {!d.family && (
        <form action={mutate} style={{ marginTop: 30 }}>
          <Hidden values={{ action: "seed", returnTo: "/app" }} />
          <Submit variant="ghost">Experimentar com a Família Silva</Submit>
        </form>
      )}
    </main>
  );
}
